import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateLearningSkillRequest {
  userId: number | string;
  skillName: string;
}

export interface LearningSkill {
  learningSkillId: number;
  userId: number | string;
  skillName: string;
  user: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class LearningSkillService {
  private readonly apiUrl = 'http://localhost:5218/api/LearningSkill';

  constructor(private http: HttpClient) {}

  getMyLearningSkills(userId: number | string): Observable<LearningSkill[]> {
    return this.http.get<LearningSkill[]>(`${this.apiUrl}/user/${userId}`);
  }

  addLearningSkill(skill: CreateLearningSkillRequest): Observable<LearningSkill> {
    return this.http.post<LearningSkill>(this.apiUrl, skill);
  }
}
