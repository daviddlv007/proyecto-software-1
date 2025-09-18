import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TrailingSlashInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let url = req.url;

    // Separar query params si existen
    const [baseUrl, query] = url.split('?');
    let finalUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    if (query) {
      finalUrl += '?' + query;
    }

    const clonedReq = req.clone({ url: finalUrl });
    return next.handle(clonedReq);
  }
}
