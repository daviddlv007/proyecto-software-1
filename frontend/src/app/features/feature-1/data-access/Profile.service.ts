import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/Profile';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Ahora baseUrl usa la variable del environment
  private baseUrl = `${environment.apiBaseUrl}/profiles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.baseUrl);
  }

  get(id: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/${id}`);
  }

  create(data: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.baseUrl, data);
  }

  update(id: number, data: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}