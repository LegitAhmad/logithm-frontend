import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // These routes fetch data by :id from the backend at request time, so
  // there's no fixed set of ids to prerender at build time.
  {
    path: 'course/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'assignment/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'problem-detail/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
