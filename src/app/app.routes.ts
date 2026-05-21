import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { Editor } from './pages/editor/editor';
import { Dashboard } from './pages/dashboard/dashboard';
import { CourseDetails } from './pages/course-details/course-details';
import { Settings } from './pages/settings/settings';
import { authGuard } from './guards/auth.guard';
import { Assignment } from './pages/assignment/assignment';
import { ProblemDetail } from './pages/problem-detail/problem-detail';
import { ProblemCreationPage } from './pages/problem-creation-page/problem-creation-page';

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
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: 'course/:id',
    title: 'Course',
    component: CourseDetails,
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    title: 'Settings',
    component: Settings,
    canActivate: [authGuard],
  },
  {
    path: 'assignment/:id',
    title: 'Assignment',
    component: Assignment,
  },
  {
    path: 'assignment',
    title: 'Assignment',
    component: Assignment,
  },
  {
    path: 'problem-detail/:id',
    title: 'Problem Detail',
    component: ProblemDetail,
  },
  {
    path: 'problem-detail',
    title: 'Problem Detail',
    component: ProblemDetail,
  },
  {
    path: 'problem-creation',
    title: 'Create Problem',
    component: ProblemCreationPage,
  },
];
