import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: {
    '(document:keydown.escape)': 'closeProfileMenu()',
  },
})
export class Navbar {
  private readonly router = inject(Router);
  private closeMenuTimeout: ReturnType<typeof setTimeout> | null = null;
  auth = inject(AuthService);
  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly user = computed(() => this.auth.user());
  readonly isProfileMenuOpen = signal(false);

  onLogout() {
    this.auth.logout();
    this.closeProfileMenu();
    void this.router.navigate(['/']);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openProfileMenu() {
    this.cancelCloseProfileMenu();
    this.isProfileMenuOpen.set(true);
  }

  scheduleCloseProfileMenu() {
    this.cancelCloseProfileMenu();
    this.closeMenuTimeout = setTimeout(() => {
      this.isProfileMenuOpen.set(false);
      this.closeMenuTimeout = null;
    }, 140);
  }

  closeProfileMenu() {
    this.cancelCloseProfileMenu();
    this.isProfileMenuOpen.set(false);
  }

  private cancelCloseProfileMenu() {
    if (!this.closeMenuTimeout) {
      return;
    }

    clearTimeout(this.closeMenuTimeout);
    this.closeMenuTimeout = null;
  }
}
