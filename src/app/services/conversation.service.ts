import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ConversationMessageDto {
  id?: number | string;
  text?: string;
  content?: string;
  message?: string;
  time?: string;
  sentAt?: string;
  createdAt?: string;
  senderId?: number | string;
  receiverId?: number | string;
  fromMe?: boolean;
  isFromMe?: boolean;
}

export interface ConversationDto {
  id?: number | string;
  conversationId?: number | string;
  participantId?: number | string;
  otherUserId?: number | string;
  userId?: number | string;
  senderId?: number | string;
  receiverId?: number | string;
  lastMessageId?: number | string;
  name?: string;
  fullName?: string;
  userName?: string;
  participantName?: string;
  otherUserName?: string;
  lastMessage?: string | ConversationMessageDto | null;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageTime?: string;
  updatedAt?: string;
  unread?: number;
  unreadCount?: number;
  skill?: string;
  skillName?: string;
  messages?: ConversationMessageDto[];
  participant?: { id?: number | string; name?: string; fullName?: string; userName?: string };
  otherUser?: { id?: number | string; name?: string; fullName?: string; userName?: string };
}

export interface ConversationMessagesResponse {
  messages?: ConversationMessageDto[];
}

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  private readonly apiUrl = 'http://localhost:5218/api/Messaging';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<ConversationDto[]> {
    return this.http.get<ConversationDto[]>(`${this.apiUrl}/conversations`);
  }

  getConversationMessages(
    conversationId: number | string,
    beforeMessageId: number | string | undefined,
    pageSize = 50,
  ): Observable<ConversationMessageDto[] | ConversationMessagesResponse> {
    let params = new HttpParams().set('pageSize', pageSize);
    if (beforeMessageId !== undefined) {
      params = params.set('beforeMessageId', beforeMessageId);
    }

    return this.http.get<ConversationMessageDto[] | ConversationMessagesResponse>(
      `${this.apiUrl}/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params },
    );
  }

  getConversationMessagesAfter(
    conversationId: number | string,
    afterMessageId: number | string,
    pageSize = 50,
  ): Observable<ConversationMessageDto[] | ConversationMessagesResponse> {
    const params = new HttpParams()
      .set('afterMessageId', afterMessageId)
      .set('pageSize', pageSize);

    return this.http.get<ConversationMessageDto[] | ConversationMessagesResponse>(
      `${this.apiUrl}/conversations/${encodeURIComponent(conversationId)}/messages/after`,
      { params },
    );
  }

  sendMessage(receiverId: number | string, content: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/messages`, { receiverId, content });
  }
}
