import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideQuillConfig } from 'ngx-quill';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding(), withRouterConfig({
      paramsInheritanceStrategy: 'always',
    })),
    provideHttpClient(),
    provideQuillConfig({
      customOptions: [{
        import: 'formats/font',
        whitelist: [
          'bebas', 'dm-sans', 'inter', 'poppins', 
          'roboto', 'roboto-mono', 'roboto-slab', 'oswald'
        ]
      }]
    })
  ]
};