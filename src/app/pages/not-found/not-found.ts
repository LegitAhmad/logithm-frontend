import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
@Component({
  selector: 'app-not-found', imports: [Navbar, RouterLink], styleUrl: '../product-pages.css',
  template: `<app-navbar /><main class="product-page"><section class="panel"><p class="muted">404</p><h1>Page not found</h1><p>The address may be incorrect, or this page may have moved.</p><div class="actions"><a class="button primary" routerLink="/dashboard">Go to courses</a><a class="button" routerLink="/problems">Browse problems</a><a routerLink="/">Home</a></div></section></main>`,
})
export class NotFound {}
