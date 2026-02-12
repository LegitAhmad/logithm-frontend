import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { Editor } from './pages/editor/editor';
import { Course } from './pages/course/course';

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
    path: 'course',
    title: 'course',
    component: Course,
  },
  {
    path: 'course/question',
    title: 'Question',
    component: Editor,
  },
];
