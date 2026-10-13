import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number | string;
  fullName: string;
  username: string;
  email: string;
  mobileNumber?: string;
}

export interface UpdateUserRequest {
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
}

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

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  login(credentials: LoginRequest): Observable<object> {
    return this.http.post<object>(`${this.apiUrl}/login`, credentials);
  }

  registerUser(user: any) {
    return this.http.post(this.apiUrl, user);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
    }, { responseType: 'text' });
  }

  updateUser(userId: number | string, user: UpdateUserRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}/${encodeURIComponent(userId)}`, user, {
      responseType: 'text',
    });
  }
}