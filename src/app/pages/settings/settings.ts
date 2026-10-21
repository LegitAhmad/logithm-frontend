import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

import { Navbar } from '../../components/navbar/navbar';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

type EditableField = 'username' | 'firstName' | 'lastName';

@Component({
  selector: 'app-settings',
  imports: [Navbar, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly isChangingPassword = signal(false);
  readonly passwordNotice = signal('');
  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  readonly profile = signal<User | null>(null);
  readonly editingField = signal<EditableField | null>(null);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly avatarUploadEnabled = signal(false);
  readonly notice = signal<string | null>(null);
  readonly avatarVersion = signal(0);

  readonly avatarSrc = computed(() => {
    const avatarUrl = this.profile()?.avatarUrl;
    if (!avatarUrl) {
      return '/defaultPfp.webp';
    }

    const separator = avatarUrl.includes('?') ? '&' : '?';
    return `${avatarUrl}${separator}v=${this.avatarVersion()}`;
  });

  readonly firstNameForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(40)]],
  });

  readonly usernameForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(16), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
  });

  readonly lastNameForm = this.fb.nonNullable.group({
    lastName: ['', [Validators.required, Validators.maxLength(40)]],
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.loadProfile();
  }

  loadProfile() {
    this.auth.fetchCurrentUser().subscribe({
      next: (user) => {
        this.profile.set(user);
        this.avatarUploadEnabled.set(user.avatarUploadEnabled === true);
        this.avatarVersion.set(Date.now());
        this.patchForms(user);
      },
      error: () => this.notice.set('Unable to load your profile right now.'),
    });
  }

  startEditing(field: EditableField) {
    const current = this.profile();
    if (!current) {
      return;
    }

    this.notice.set(null);
    this.editingField.set(field);

    if (field === 'firstName') {
      this.firstNameForm.setValue({ firstName: current.firstName });
    }

    if (field === 'username') {
      this.usernameForm.setValue({ username: current.username ?? '' });
    }

    if (field === 'lastName') {
      this.lastNameForm.setValue({ lastName: current.lastName });
    }
  }

  cancelEditing() {
    const current = this.profile();
    if (current) {
      this.patchForms(current);
    }

    this.editingField.set(null);
    this.notice.set(null);
  }

  saveField(field: EditableField) {
    if (this.isSaving()) {
      return;
    }

    const current = this.profile();
    if (!current) {
      return;
    }

    this.notice.set(null);
    this.isSaving.set(true);

    if (field === 'firstName') {
      if (this.firstNameForm.invalid) {
        this.firstNameForm.markAllAsTouched();
        this.isSaving.set(false);
        return;
      }

      this.persistProfile({
        username: current.username,
        firstName: this.firstNameForm.getRawValue().firstName,
        lastName: current.lastName,
      });
      return;
    }

    if (field === 'lastName') {
      if (this.lastNameForm.invalid) {
        this.lastNameForm.markAllAsTouched();
        this.isSaving.set(false);
        return;
      }

      this.persistProfile({
        username: current.username,
        firstName: current.firstName,
        lastName: this.lastNameForm.getRawValue().lastName,
      });
      return;
    }

    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.isSaving.set(false);
      return;
    }

    this.persistProfile({
      username: this.usernameForm.getRawValue().username,
      firstName: current.firstName,
      lastName: current.lastName,
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.isUploadingAvatar()) {
      return;
    }

    this.notice.set(null);
    this.isUploadingAvatar.set(true);

    this.auth
      .uploadAvatar(file)
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.avatarVersion.set(Date.now());
          this.patchForms(user);
          this.notice.set('Avatar updated successfully.');
        },
        error: () => this.notice.set('Failed to upload avatar.'),
      });

    input.value = '';
  }

  changePassword() {
    if (this.isChangingPassword()) return;
    this.passwordForm.markAllAsTouched();
    const values = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || values.newPassword !== values.confirmPassword || new TextEncoder().encode(values.newPassword).length > 72) {
      this.passwordNotice.set('Use at least eight characters (at most 72 UTF-8 bytes), and make sure the new passwords match.');
      return;
    }
    this.isChangingPassword.set(true); this.passwordNotice.set('');
    this.auth.changePassword(values.currentPassword, values.newPassword).pipe(finalize(() => this.isChangingPassword.set(false))).subscribe({
      next: () => { this.passwordForm.reset(); void this.router.navigate(['/login'], {queryParams:{passwordChanged:'true'}}); },
      error: err => this.passwordNotice.set(typeof err.error?.message === 'string' ? err.error.message : 'Could not change your password. Check your current password and try again.'),
    });
  }

  private patchForms(user: User) {
    this.usernameForm.patchValue({ username: user.username ?? '' });
    this.firstNameForm.patchValue({ firstName: user.firstName });
    this.lastNameForm.patchValue({ lastName: user.lastName });
  }

  private persistProfile(payload: { username?: string; firstName: string; lastName: string }) {
    this.auth
      .updateProfile(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.avatarVersion.set(Date.now());
          this.patchForms(user);
          this.editingField.set(null);
          this.notice.set('Profile updated successfully.');
        },
        error: () => this.notice.set('Failed to save profile changes.'),
      });
  }
}
