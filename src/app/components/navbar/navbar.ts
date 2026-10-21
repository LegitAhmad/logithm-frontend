import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar', imports: [RouterLink, RouterLinkActive], templateUrl: './navbar.html', styleUrl: './navbar.css',
  host: { '(document:keydown.escape)': 'closeProfileMenu()' },
})
export class Navbar {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly user = computed(() => this.auth.user());
  readonly isProfileMenuOpen = signal(false);
  onLogout() {
    this.auth.logout();
    this.isProfileMenuOpen.set(false);
    void this.router.navigate(['/']);
  }
  closeProfileMenu() { this.isProfileMenuOpen.set(false); }
  openProfileMenu() { this.isProfileMenuOpen.set(true); }
}
