import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService
      .signup({ firstName, lastName, email, password })
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

    return 'Unable to sign up. Please try again.';
  }
}
