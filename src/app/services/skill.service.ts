
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SkillUser {
  id?: number | string;
  userId?: number | string;
  fullName?: string;
  name?: string;
  username?: string;
  rating?: number | null;
  totalSessions?: number | null;
  sessions?: number | null;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UserSkill {
  id: number;
  userId: number;
  skillName: string;
  skillType: string;
  skillLevel: string;
}

export interface LearningSkill {
  id: number;
  name: string;
}

export interface CreateSkillRequest {
  userId: number | string;
  skillName: string;
  skillType: string;
  skillLevel: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private readonly apiUrl = 'http://localhost:5218/api/Skill';
  private readonly skillUsersApiUrl = 'http://localhost:5218/api/skills/users';

  constructor(private http: HttpClient) {}

  getUsersBySkill(skillName: string): Observable<SkillUser[]> {
    const params = new HttpParams().set('skillName', skillName);

    return this.http.get<SkillUser[]>(this.skillUsersApiUrl, { params });
  }

  // Get skills the user knows
  getMySkills(id: number | string): Observable<UserSkill[]> {
    return this.http.get<UserSkill[]>(`${this.apiUrl}/user/${id}`);
  }

  // Add a skill the user knows
  addSkill(skill: CreateSkillRequest): Observable<UserSkill> {
    return this.http.post<UserSkill>(this.apiUrl, skill);
  }

  // Delete a skill by database ID
  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get skills the user wants to learn
  getLearningSkills(): Observable<LearningSkill[]> {
    return this.http.get<LearningSkill[]>(`${this.apiUrl}/learning`);
  }

  // Add a learning skill
  addLearningSkill(skillName: string): Observable<LearningSkill> {
    return this.http.post<LearningSkill>(`${this.apiUrl}/learning`, { skillName });
  }

  // Delete a learning skill by database ID
  deleteLearningSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/learning/${id}`);
  }
}
