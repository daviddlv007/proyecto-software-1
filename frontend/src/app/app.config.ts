import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Importar BASE_PATH de la API generada
import { BASE_PATH } from './shared/api/variables';
import { environment } from '../environments/environment.base';
import { TrailingSlashInterceptor } from './core/interceptors/trailing-slash.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),

    // Base URL de la API
    { provide: BASE_PATH, useValue: environment.apiBaseUrl },

    // <- Interceptor mínimo funcional para agregar barra final a todas las solicitudes
    { provide: HTTP_INTERCEPTORS, useClass: TrailingSlashInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
};
