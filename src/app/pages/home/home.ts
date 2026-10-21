import { Component } from '@angular/core';
import { Features } from '../../components/features/features';
import { Hero } from '../../components/hero/hero';
import { Navbar } from '../../components/navbar/navbar';
import { Testimonials } from '../../components/testimonials/testimonials';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar, Hero, Features, Testimonials],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
