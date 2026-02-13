import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  imports: [Navbar]
})

export class Dashboard {
  courses = [
    { name: 'Programming Fundamentals', professor: 'Prof Samyan Wahla',isFavorite:false },
    { name: 'Object Oriented Programming', professor: 'Prof Nauman Shaffi',isFavorite:false },
    { name: 'Database Design', professor: 'Prof Samyan Wahla',isFavorite:false },
    { name: 'Data Structures & Algorithms', professor: 'Prof Nazeef Ul Haq',isFavorite:false }
  ];

  pending = [
    {
      course: 'Programming Fundamentals',
      tasks: [{ title: 'Submit PD all task', dueTime: '12:00', dueDate: '2/5/2026' }]
    },
    {
      course: 'Data Structures & Algorithms',
      tasks: [
        { title: 'Submission of Lab 1', dueTime: '24:00', dueDate: '2/7/2026' },
        { title: 'Submission of Lab 2', dueTime: '23:00', dueDate: '2/15/2026' }
      ]
    }
  ];

  toggleFavorite(course: any) {
    course.isFavorite = !course.isFavorite;
  }
}