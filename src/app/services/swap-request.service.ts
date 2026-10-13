import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SwapRequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed';

export interface SwapRequestDto {
  id: number;
  senderId: number | string;
  senderName: string;
  receiverId: number | string;
  receiverName: string;
  skillOffered: string;
  skillWanted: string;
  status: SwapRequestStatus;
  createdAt: string;
}

export interface CreateSwapRequest {
  senderId: number | string;
  receiverId: number | string;
  skillOffered: string;
  skillWanted: string;
}

@Injectable({
  providedIn: 'root',
})
export class SwapRequestService {
  private readonly apiUrl = 'http://localhost:5218/api/Request';

  constructor(private http: HttpClient) {}

  getMyRequests(userId: number | string): Observable<SwapRequestDto[]> {
    return this.http.get<SwapRequestDto[]>(`${this.apiUrl}/user/${encodeURIComponent(userId)}`);
  }

  createRequest(request: CreateSwapRequest): Observable<SwapRequestDto> {
    return this.http.post<SwapRequestDto>(this.apiUrl, request);
  }

  updateStatus(id: number, status: 'Accepted' | 'Declined'): Observable<SwapRequestDto> {
    return this.http.patch<SwapRequestDto>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
