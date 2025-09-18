// src/app/core/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Importa el tipo Error generado (ruta generada)
import type { Error } from '../../shared/models';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // Si el backend devuelve el body con la forma del contrato, lo casteamos
        const apiError = (err.error && typeof err.error === 'object') ? (err.error as Error) : {
          type: 'http_error',
          title: err.statusText || 'HTTP Error',
          status: err.status || 500,
          detail: err.message || 'Error desconocido'
        } as Error;

        // Aquí puedes: loggear, notificar, transformar, reintentar, mapear errores de negocio...
        console.error('[API ERROR]', apiError);

        return throwError(() => apiError);
      })
    );
  }
}
