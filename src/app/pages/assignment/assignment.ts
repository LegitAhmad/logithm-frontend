import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { text } from 'stream/consumers';

@Component({
  selector: 'app-assignment',
  imports: [Navbar],
  templateUrl: './assignment.html',
  styleUrl: './assignment.css',
})
export class Assignment {
 questions = [
    { text: 'Write a program to calculate factorial of any number ', due: '12:00 2/12/2026' },
    { text: 'Write a program to calculate sun of any two  number ', due: '23:00 10/12/2026' },
    { text: 'Write a program to recursively calculate the largest among all numbers ', due: '12:00 2/12/2026' }
  ];
}
