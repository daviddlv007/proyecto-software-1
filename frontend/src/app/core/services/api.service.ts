// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.base';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params as Record<string, string> });
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: any, headers?: Record<string, string>): Observable<T> {
    const httpHeaders = headers ? new HttpHeaders(headers) : undefined;
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: httpHeaders });
  }
}
