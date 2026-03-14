import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { Editor } from './pages/editor/editor';
import { Dashboard } from './pages/dashboard/dashboard';
import { CourseDetails } from './pages/course-details/course-details';
import { Assignment } from './pages/assignment/assignment';
import { ProblemDetail } from './pages/problem-detail/problem-detail';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    title: 'Logithm | Login',
    component: Login,
  },
  {
    path: 'signup',
    title: 'Logithm | Join Now',
    component: Signup,
  },
  {
    path: 'course/question',
    title: 'Course | Question',
    component: Editor,
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    component: Dashboard,
  },
  {
    path: 'course',
    title: 'Course',
    component: CourseDetails,
  },
  {
    path: 'assignment',
    title: 'Assignment',
    component: Assignment,
  },
  {
    path: 'problem-detail',
    title: 'Problem Detail',
    component: ProblemDetail,
  },
];
