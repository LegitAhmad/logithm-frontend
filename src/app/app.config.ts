import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {HttpClient,provideHttpClient, withFetch } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    provideMarkdown({ loader: HttpClient }),
    provideMonacoEditor({
      baseUrl: 'assets/monaco/vs'
    })
  ],
};
