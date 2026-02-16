import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { Editor } from './pages/editor/editor';
import { Course } from './pages/course/course';
import { QuestionEditorComponent } from './components/question-editor/question-editor';
import { Dashboard } from './pages/dashboard/dashboard';
import { CourseDetails } from './pages/course-details/course-details';

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
  {
    path: 'question-editor',
    title: 'Question Editor',
    component: QuestionEditorComponent,
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
];
