import type { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth.guard';
import { NotFound } from './pages/not-found/not-found';

// Router-selected lazy modules keep forms and coding/authoring dependencies off the public entry bundle.
export const routes: Routes = [
  { path: '', component: Home, title: 'Logithm', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(module => module.Login), title: 'Logithm | Login' },
  { path: 'signup', loadComponent: () => import('./pages/auth/signup/signup').then(module => module.Signup), title: 'Logithm | Join now' },
  { path: 'course/question', redirectTo: 'problems', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(module => module.Dashboard), title: 'Courses', canActivate: [authGuard] },
  { path: 'course/:id', loadComponent: () => import('./pages/course-details/course-details').then(module => module.CourseDetails), title: 'Course', canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(module => module.Settings), title: 'Settings', canActivate: [authGuard] },
  { path: 'assignment/:id', loadComponent: () => import('./pages/assignment/assignment').then(module => module.Assignment), title: 'Assignment', canActivate: [authGuard] },
  { path: 'assignment', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'problems', loadComponent: () => import('./pages/problem-bank/problem-bank').then(module => module.ProblemBank), title: 'Problem bank', canActivate: [authGuard] },
  { path: 'problem-detail/:id', loadComponent: () => import('./pages/problem-detail/problem-detail').then(module => module.ProblemDetail), title: 'Problem workspace', canActivate: [authGuard] },
  { path: 'problem-detail', redirectTo: 'problems', pathMatch: 'full' },
  { path: 'problem-creation', loadComponent: () => import('./pages/problem-creation-page/problem-creation-page').then(module => module.ProblemCreationPage), title: 'Author problem', canActivate: [authGuard] },
  { path: 'submissions', loadComponent: () => import('./pages/submission-history/submission-history').then(module => module.SubmissionHistory), title: 'Submission history', canActivate: [authGuard] },
  { path: 'submissions/:id', loadComponent: () => import('./pages/submission-detail/submission-detail').then(module => module.SubmissionDetail), title: 'Submission results', canActivate: [authGuard] },
  { path: '**', component: NotFound, title: 'Page not found' },
];
