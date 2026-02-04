import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-editor',
  imports: [Navbar],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor {}
