import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-course-details',
  imports: [Navbar],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
})
export class CourseDetails {
  isHovered = false;

  assignments = [
    { title: 'Submit All PD Tasks', due: '12:00 2/12/2026' },
    { title: 'Submit Mid Lab Report', due: '23:00 10/12/2026' },
    { title: 'Submit Lab Manual 3 Tasks', due: '12:00 2/12/2026' }
  ];
}
