import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MessagesComponent } from './messages';
import { authInterceptor } from '../../shared/auth/auth.interceptor';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesComponent],
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.setItem('userdetails', JSON.stringify({
      user: { id: 4 },
      token: 'sample-token',
    }));
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem('token');
    localStorage.removeItem('userdetails');
  });

  it('loads and displays conversations using the saved bearer token', () => {
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([]);
    const request = httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer sample-token');
    request.flush([{
      conversationId: 'conversation-1',
      otherUserName: 'Priya Nair',
      lastMessage: 'See you soon!',
      lastMessageTime: '2026-10-13T09:00:00Z',
      unreadCount: 2,
      skillName: 'UI/UX Design',
      messages: [{ id: 8, text: 'See you soon!', time: '9:00 AM' }],
    }]);
    const historyRequest = httpTestingController.expectOne(
      request => request.url === 'http://localhost:5218/api/Messaging/conversations/conversation-1/messages',
    );
    expect(historyRequest.request.params.get('pageSize')).toBe('50');
    expect(historyRequest.request.params.has('beforeMessageId')).toBe(false);
    historyRequest.flush([{ id: 8, text: 'See you soon!', time: '9:00 AM' }]);
    fixture.detectChanges();

    expect(component.conversations()).toHaveLength(1);
    expect(component.activeId()).toBe('conversation-1');
    expect(fixture.nativeElement.textContent).toContain('Priya Nair');
    expect(fixture.nativeElement.textContent).toContain('See you soon!');
  });

  it('maps the API conversation shape with userId, fullName, and a nested latest message', () => {
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([]);
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    ).flush([{
      userId: 9,
      fullName: 'Manoj',
      lastMessage: {
        id: 2,
        senderId: 9,
        receiverId: 10,
        content: 'Hello',
        createdAt: '2026-10-13T13:28:49.664263Z',
      },
    }]);
    const historyRequest = httpTestingController.expectOne(
      request => request.url === 'http://localhost:5218/api/Messaging/conversations/9/messages',
    );
    expect(historyRequest.request.params.get('beforeMessageId')).toBe('2');
    expect(historyRequest.request.params.get('pageSize')).toBe('50');
    historyRequest.flush([{
      id: 2,
      senderId: 9,
      receiverId: 10,
      content: 'Hello',
      createdAt: '2026-10-13T13:28:49.664263Z',
    }, {
      id: 1,
      senderId: 10,
      receiverId: 9,
      content: 'Earlier message',
      createdAt: '2026-10-13T13:20:00Z',
    }]);
    fixture.detectChanges();

    expect(component.conversations()).toHaveLength(1);
    expect(component.activeId()).toBe(9);
    expect(component.activeConversation()?.name).toBe('Manoj');
    expect(component.activeConversation()?.recipientId).toBe(9);
    expect(component.activeConversation()?.lastMessage).toBe('Hello');
    expect(component.activeConversation()?.messages).toEqual([
      { id: 1, text: 'Earlier message', time: '2026-10-13T13:20:00Z', fromMe: false },
      { id: 2, text: 'Hello', time: '2026-10-13T13:28:49.664263Z', fromMe: true },
    ]);
    expect(fixture.nativeElement.textContent).toContain('Manoj');
    expect(fixture.nativeElement.textContent).toContain('Hello');
  });

  it('opens the chat at the bottom and fetches older messages when scrolling to the top', () => {
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([]);
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    ).flush([{
      userId: 9,
      fullName: 'Manoj',
      lastMessage: {
        id: 100,
        senderId: 9,
        receiverId: 10,
        content: 'Latest',
        createdAt: '2026-10-13T13:28:49.664263Z',
      },
    }]);
    const initialPage = Array.from({ length: 50 }, (_, index) => ({
      id: index + 51,
      senderId: index % 2 === 0 ? 10 : 9,
      receiverId: index % 2 === 0 ? 9 : 10,
      content: `Message ${index + 1}`,
      createdAt: `2026-10-13T13:${String(index).padStart(2, '0')}:00Z`,
    }));
    httpTestingController.expectOne(
      request => request.url === 'http://localhost:5218/api/Messaging/conversations/9/messages',
    ).flush(initialPage);
    fixture.detectChanges();

    const chatBody = fixture.nativeElement.querySelector('.chat-body') as HTMLElement;
    expect(chatBody.scrollTop).toBe(chatBody.scrollHeight);
    Object.defineProperty(chatBody, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(chatBody, 'scrollTop', { configurable: true, value: 0 });
    Object.defineProperty(chatBody, 'clientHeight', { configurable: true, value: 50 });
    chatBody.dispatchEvent(new Event('scroll'));

    const nextPageRequest = httpTestingController.expectOne(
      request => request.url === 'http://localhost:5218/api/Messaging/conversations/9/messages'
        && request.params.get('beforeMessageId') === '100',
    );
    expect(nextPageRequest.request.params.get('pageSize')).toBe('50');
    nextPageRequest.flush([{
      id: 50,
      senderId: 10,
      receiverId: 9,
      content: 'Older message',
      createdAt: '2026-10-13T12:00:00Z',
    }]);
    fixture.detectChanges();

    expect(component.activeConversation()?.messages.map(message => message.text)).toContain('Older message');
    expect(component.activeConversation()?.hasMoreMessages).toBe(false);
  });

  it('polls after the newest message ID and appends received messages', () => {
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([]);
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    ).flush([{
      userId: 9,
      fullName: 'Manoj',
      lastMessage: {
        id: 13,
        senderId: 9,
        receiverId: 4,
        content: 'Previous message',
        createdAt: '2026-10-13T13:28:49.664263Z',
      },
    }]);
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations/9/messages',
    ).flush([{
      id: 13,
      senderId: 9,
      receiverId: 4,
      content: 'Previous message',
      createdAt: '2026-10-13T13:28:49.664263Z',
    }]);

    component.draft.set('My sent message');
    component.sendMessage();
    httpTestingController.expectOne('http://localhost:5218/api/Messaging/messages').flush({});

    component.checkForNewMessages();
    const request = httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations/9/messages/after?afterMessageId=13&pageSize=50',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 14,
      senderId: 4,
      receiverId: 9,
      content: 'My sent message',
      createdAt: '2026-10-13T13:29:00Z',
    }, {
      id: 15,
      senderId: 9,
      receiverId: 4,
      content: 'A new message',
      createdAt: '2026-10-13T13:30:00Z',
    }]);

    expect(component.activeConversation()?.messages.map(message => message.text)).toEqual([
      'Previous message',
      'My sent message',
      'A new message',
    ]);
    expect(component.activeConversation()?.messages.filter(message => message.text === 'My sent message')).toHaveLength(1);
    expect(component.activeConversation()?.lastMessageId).toBe(15);
    expect(component.activeConversation()?.lastMessage).toBe('A new message');
  });

  it('shows an error and allows reloading when conversations cannot be fetched', () => {
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([]);
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    ).flush('Server error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loadError()).toBe('Failed to load conversations. Please try again.');
    expect(fixture.nativeElement.textContent).toContain('Failed to load conversations');

    component.loadConversations();
    httpTestingController.expectOne(
      'http://localhost:5218/api/Messaging/conversations',
    ).flush([]);
    fixture.detectChanges();

    expect(component.loadError()).toBe('');
    expect(fixture.nativeElement.textContent).toContain('No conversations yet.');
  });

  it('searches users and sends the first message to create a conversation', () => {
    httpTestingController.expectOne('http://localhost:5218/api/Messaging/conversations').flush([]);
    httpTestingController.expectOne('http://localhost:5218/api/User').flush([
      { id: 4, fullName: 'Current User', username: 'me', email: 'me@example.com' },
      { id: 10, fullName: 'Priya', username: 'PK', email: 'priya@com' },
    ]);
    component.search.set('priya');
    expect(component.matchingUsers().map(user => user.id)).toEqual([10]);

    component.startConversation(component.matchingUsers()[0]);
    expect(component.activeConversation()?.name).toBe('Priya');
    component.draft.set('Hello!');
    component.sendMessage();

    const request = httpTestingController.expectOne('http://localhost:5218/api/Messaging/messages');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ receiverId: 10, content: 'Hello!' });
    request.flush({});

    expect(component.activeConversation()?.messages).toEqual([
      { id: 1, text: 'Hello!', time: 'Now', fromMe: true },
    ]);
    expect(component.draft()).toBe('');
  });
});
