import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (tokens) => {
          this.authService.storeTokens(tokens);
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.readErrorMessage(error));
        },
      });
  }

  private readErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error as unknown;

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    return 'Unable to log in. Please try again.';
  }
}
