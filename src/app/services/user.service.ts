import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:5218/api/User';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<object> {
    return this.http.post<object>(`${this.apiUrl}/login`, credentials);
  }

  registerUser(user: any) {
    return this.http.post(this.apiUrl, user);
  }
}