import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, interval, map } from 'rxjs';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { ConversationDto, ConversationMessageDto, ConversationService } from '../../services/conversation.service';
import { UserDto, UserService } from '../../services/user.service';

type Message = {
  id: number | string;
  text: string;
  time: string;
  fromMe: boolean;
};

type Conversation = {
  id: number | string;
  name: string;
  avatar: string;
  skill: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
  latestMessage?: ConversationMessageDto;
  recipientId?: number | string;
  isNew?: boolean;
  lastMessageId?: number | string;
  nextBeforeMessageId?: number | string;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
};

const MESSAGE_PAGE_SIZE = 50;

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('chatBody') private chatBody?: ElementRef<HTMLElement>;
  private pendingScroll: { type: 'bottom' } | { type: 'preserve'; height: number; top: number } | null = null;
  private pollingSubscription?: Subscription;
  private pollingRequest?: Subscription;
  private isPollingMessages = false;

  activeId = signal<number | string | null>(null);
  draft = signal('');
  search = signal('');
  isLoading = signal(true);
  loadError = signal('');
  isLoadingUsers = signal(true);
  usersError = signal('');
  sendError = signal('');
  isSending = signal(false);
  historyLoadingId = signal<number | string | null>(null);
  historyError = signal('');
  pollingError = signal('');
  users = signal<UserDto[]>([]);
  conversations = signal<Conversation[]>([]);
  filteredConversations = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.conversations().filter(conversation =>
      !query
      || conversation.name.toLocaleLowerCase().includes(query)
      || conversation.lastMessage.toLocaleLowerCase().includes(query)
      || conversation.skill.toLocaleLowerCase().includes(query),
    );
  });

  activeConversation = computed<Conversation | undefined>(() =>
    this.conversations().find((c: Conversation) => c.id === this.activeId()),
  );

  totalUnread = computed(() =>
    this.conversations().reduce((sum: number, c: Conversation) => sum + c.unread, 0),
  );

  constructor(
    private router: Router,
    private conversationService: ConversationService,
    private userService: UserService,
  ) {
    this.loadConversations();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.stopNewMessagePolling();
  }

  ngAfterViewChecked(): void {
    const element = this.chatBody?.nativeElement;
    const pendingScroll = this.pendingScroll;
    if (!element || !pendingScroll) {
      return;
    }

    this.pendingScroll = null;
    element.scrollTop = pendingScroll.type === 'bottom'
      ? element.scrollHeight
      : pendingScroll.top + element.scrollHeight - pendingScroll.height;
  }

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.conversationService.getConversations().pipe(
      map(conversations => conversations.map(conversation => this.mapConversation(conversation))),
    ).subscribe({
      next: mapped => {
        this.conversations.set(mapped);
        this.activeId.set(mapped[0]?.id ?? null);
        this.isLoading.set(false);
        const firstConversation = mapped[0];
        if (firstConversation) {
          this.loadMessages(firstConversation);
        }
      },
      error: error => {
        console.error('Failed to load conversations:', error);
        this.loadError.set('Failed to load conversations. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  loadUsers(): void {
    this.isLoadingUsers.set(true);
    this.usersError.set('');

    this.userService.getUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.isLoadingUsers.set(false);
      },
      error: error => {
        console.error('Failed to load users for conversation search:', error);
        this.usersError.set('Failed to load users. Please try again.');
        this.isLoadingUsers.set(false);
      },
    });
  }

  matchingUsers(): UserDto[] {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) {
      return [];
    }

    const currentUserId = this.getCurrentUserId();
    return this.users().filter(user =>
      String(user.id) !== String(currentUserId)
      && (
        user.fullName.toLocaleLowerCase().includes(query)
        || user.username.toLocaleLowerCase().includes(query)
        || user.email.toLocaleLowerCase().includes(query)
      ),
    );
  }

  startConversation(user: UserDto): void {
    const existing = this.conversations().find(conversation =>
      (conversation.recipientId !== undefined
        && String(conversation.recipientId) === String(user.id))
      || conversation.name.toLocaleLowerCase() === user.fullName.toLocaleLowerCase(),
    );

    if (existing) {
      this.selectConversation(existing.id);
      return;
    }

    const name = user.fullName || user.username || user.email;
    const draftConversation: Conversation = {
      id: `new-${user.id}`,
      name,
      avatar: name.trim().charAt(0).toUpperCase() || '?',
      skill: 'Conversation',
      lastMessage: 'Start a conversation',
      time: '',
      unread: 0,
      online: false,
      messages: [],
      recipientId: user.id,
      isNew: true,
    };

    this.conversations.update(conversations => [
      ...conversations.filter(conversation =>
        conversation.recipientId === undefined
        || String(conversation.recipientId) !== String(user.id),
      ),
      draftConversation,
    ]);
    this.pendingScroll = { type: 'bottom' };
    this.activeId.set(draftConversation.id);
    this.search.set('');
    this.sendError.set('');
  }

  selectConversation(id: number | string): void {
    this.stopNewMessagePolling();
    this.pendingScroll = { type: 'bottom' };
    this.activeId.set(id);
    this.sendError.set('');
    this.historyError.set('');
    this.pollingError.set('');
    this.conversations.update((list: Conversation[]) =>
      list.map((c: Conversation) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
    const conversation = this.conversations().find(item => item.id === id);
    if (conversation && !conversation.isNew) {
      this.loadMessages(conversation);
    }
  }

  checkForNewMessages(): void {
    const conversation = this.activeConversation();
    if (
      !conversation
      || conversation.isNew
      || conversation.lastMessageId === undefined
      || this.isPollingMessages
    ) {
      return;
    }

    this.isPollingMessages = true;
    this.pollingRequest = this.conversationService.getConversationMessagesAfter(
      conversation.id,
      conversation.lastMessageId,
      MESSAGE_PAGE_SIZE,
    ).pipe(
      map(response => Array.isArray(response) ? response : response.messages ?? []),
      finalize(() => {
        this.isPollingMessages = false;
        this.pollingRequest = undefined;
      }),
    ).subscribe({
      next: incoming => {
        this.pollingError.set('');
        if (incoming.length === 0) {
          return;
        }

        const current = this.conversations().find(item => item.id === conversation.id);
        if (!current) {
          return;
        }

        const messages = [...current.messages];
        let changed = false;
        for (const [index, incomingMessage] of incoming.entries()) {
          const newMessage = this.mapMessage(incomingMessage, messages.length + index);
          const existingIndex = incomingMessage.id === undefined
            ? -1
            : messages.findIndex(message => String(message.id) === String(incomingMessage.id));
          if (existingIndex >= 0) {
            continue;
          }

          const localEchoIndex = incomingMessage.senderId !== undefined
            && String(incomingMessage.senderId) === String(this.getCurrentUserId())
            ? messages.findIndex(message =>
                message.fromMe
                && String(message.id).startsWith('local-')
                && message.text === newMessage.text,
              )
            : -1;

          if (localEchoIndex >= 0) {
            messages[localEchoIndex] = newMessage;
          } else {
            messages.push(newMessage);
          }
          changed = true;
        }
        if (!changed) {
          return;
        }

        const chatBody = this.chatBody?.nativeElement;
        const isAtBottom = chatBody
          ? chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight <= 40
          : true;
        const latest = incoming[incoming.length - 1];
        this.conversations.update(conversations => conversations.map(item =>
          item.id === conversation.id
            ? {
                ...item,
                messages,
                lastMessageId: latest.id ?? item.lastMessageId,
                latestMessage: latest,
                lastMessage: latest.content ?? latest.text ?? latest.message ?? item.lastMessage,
                time: this.formatConversationTime(latest.createdAt ?? latest.sentAt ?? latest.time)
                  || item.time,
              }
            : item,
        ));

        if (this.activeId() === conversation.id && isAtBottom) {
          this.pendingScroll = { type: 'bottom' };
        }
      },
      error: error => {
        console.error('Failed to check for new messages:', error);
        if (this.activeId() === conversation.id) {
          this.pollingError.set('Unable to check for new messages. Retrying automatically.');
        }
      },
    });
  }

  private startNewMessagePolling(): void {
    this.stopNewMessagePolling();
    this.pollingSubscription = interval(5000).subscribe(() => this.checkForNewMessages());
  }

  private stopNewMessagePolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
    this.pollingRequest?.unsubscribe();
    this.pollingRequest = undefined;
    this.isPollingMessages = false;
  }

  loadMessages(conversation: Conversation): void {
    this.historyLoadingId.set(conversation.id);
    this.historyError.set('');

    this.conversationService.getConversationMessages(
      conversation.id,
      conversation.lastMessageId,
      MESSAGE_PAGE_SIZE,
    ).pipe(
      map(response => Array.isArray(response) ? response : response.messages ?? []),
    ).subscribe({
      next: page => {
        const messages = this.mergeLatestMessage(conversation, page);
        const cursor = page.length >= MESSAGE_PAGE_SIZE
          ? page[MESSAGE_PAGE_SIZE - 1]?.id
          : undefined;
        this.conversations.update(conversations => conversations.map(item =>
          item.id === conversation.id
            ? {
                ...item,
                messages,
                nextBeforeMessageId: cursor,
                hasMoreMessages: cursor !== undefined,
              }
            : item,
        ));
        if (this.activeId() === conversation.id) {
          this.pendingScroll = { type: 'bottom' };
          this.startNewMessagePolling();
        }
        if (this.historyLoadingId() === conversation.id) {
          this.historyLoadingId.set(null);
        }
      },
      error: error => {
        console.error('Failed to load conversation messages:', error);
        if (this.activeId() === conversation.id) {
          this.historyError.set('Failed to load messages. Please try again.');
        }
        if (this.historyLoadingId() === conversation.id) {
          this.historyLoadingId.set(null);
        }
      },
    });
  }

  onChatScroll(event: Event): void {
    const element = event.currentTarget;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const isAtTop = element.scrollTop <= 40;
    const conversation = this.activeConversation();
    if (isAtTop && conversation) {
      this.loadMoreMessages(conversation);
    }
  }

  loadMoreMessages(conversation: Conversation): void {
    const cursor = conversation.nextBeforeMessageId;
    if (
      !conversation.hasMoreMessages
      || conversation.isLoadingMore
      || cursor === undefined
    ) {
      return;
    }

    this.historyError.set('');
    this.conversations.update(conversations => conversations.map(item =>
      item.id === conversation.id ? { ...item, isLoadingMore: true } : item,
    ));

    this.conversationService.getConversationMessages(
      conversation.id,
      cursor,
      MESSAGE_PAGE_SIZE,
    ).pipe(
      map(response => Array.isArray(response) ? response : response.messages ?? []),
    ).subscribe({
      next: page => {
        const element = this.chatBody?.nativeElement;
        const previousHeight = element?.scrollHeight ?? 0;
        const previousTop = element?.scrollTop ?? 0;
        const nextCursor = page.length >= MESSAGE_PAGE_SIZE
          ? page[MESSAGE_PAGE_SIZE - 1]?.id
          : undefined;
        this.conversations.update(conversations => conversations.map(item => {
          if (item.id !== conversation.id) {
            return item;
          }

          const knownIds = new Set(item.messages.map(message => String(message.id)));
          const newMessages = page
            .filter(message => message.id === undefined || !knownIds.has(String(message.id)))
            .map((message, index) => this.mapMessage(message, index));

          return {
            ...item,
            messages: [...newMessages, ...item.messages],
            nextBeforeMessageId: nextCursor,
            hasMoreMessages: nextCursor !== undefined && nextCursor !== cursor,
            isLoadingMore: false,
          };
        }));
        if (this.activeId() === conversation.id && element) {
          this.pendingScroll = {
            type: 'preserve',
            height: previousHeight,
            top: previousTop,
          };
        }
      },
      error: error => {
        console.error('Failed to load more conversation messages:', error);
        if (this.activeId() === conversation.id) {
          this.historyError.set('Failed to load more messages. Please try again.');
        }
        this.conversations.update(conversations => conversations.map(item =>
          item.id === conversation.id ? { ...item, isLoadingMore: false } : item,
        ));
      },
    });
  }

  sendMessage(event?: Event): void {
    event?.preventDefault();
    const text = this.draft().trim();
    if (!text) return;

    const conv = this.activeConversation();
    if (!conv) return;
    if (conv.recipientId === undefined || this.isSending()) {
      this.sendError.set('Unable to send a message to this user. Please try again later.');
      return;
    }

    this.sendError.set('');
    this.isSending.set(true);
    this.conversationService.sendMessage(conv.recipientId, text).pipe(
      finalize(() => this.isSending.set(false)),
    ).subscribe({
      next: () => {
        const newMessage: Message = {
          id: `local-${Date.now()}`,
          text,
          time: 'Now',
          fromMe: true,
        };
        this.conversations.update(conversations =>
          conversations.map(conversation =>
            conversation.id === conv.id
              ? {
                  ...conversation,
                  isNew: false,
                  messages: [...conversation.messages, newMessage],
                  lastMessage: text,
                  latestMessage: {
                    content: text,
                    createdAt: new Date().toISOString(),
                    senderId: this.getCurrentUserId() ?? undefined,
                  },
                  time: 'Now',
                }
              : conversation,
          ),
        );
        if (this.activeId() === conv.id) {
          this.pendingScroll = { type: 'bottom' };
        }
        this.draft.set('');
      },
      error: error => {
        console.error('Failed to send message:', error);
        this.sendError.set('Failed to send your message. Please try again.');
      },
    });
  }

  private mapConversation(conversation: ConversationDto): Conversation {
    const id = conversation.conversationId ?? conversation.id ?? conversation.userId;
    if ((typeof id !== 'number' && typeof id !== 'string') || !String(id).trim()) {
      throw new Error('A conversation returned by the API is missing its ID.');
    }

    const name = conversation.otherUserName
      ?? conversation.participantName
      ?? conversation.fullName
      ?? conversation.name
      ?? conversation.userName
      ?? conversation.participant?.fullName
      ?? conversation.participant?.name
      ?? conversation.participant?.userName
      ?? conversation.otherUser?.fullName
      ?? conversation.otherUser?.name
      ?? conversation.otherUser?.userName
      ?? 'Unknown user';
    const latestMessage = typeof conversation.lastMessage === 'string'
      ? conversation.lastMessage
      : conversation.lastMessage?.text ?? conversation.lastMessage?.content ?? conversation.lastMessage?.message;
    const lastMessage = conversation.lastMessageText ?? latestMessage ?? '';
    const messages = (conversation.messages ?? []).map((message, index) => this.mapMessage(message, index));
    if (
      messages.length === 0
      && typeof conversation.lastMessage === 'object'
      && conversation.lastMessage !== null
    ) {
      messages.push(this.mapMessage(conversation.lastMessage, 0));
    }

    return {
      id,
      name,
      avatar: name.trim().charAt(0).toUpperCase() || '?',
      skill: conversation.skillName ?? conversation.skill ?? 'Conversation',
      lastMessage,
      time: this.formatConversationTime(
        conversation.lastMessageAt
        ?? conversation.lastMessageTime
        ?? conversation.updatedAt
        ?? (typeof conversation.lastMessage === 'object' && conversation.lastMessage
          ? conversation.lastMessage.sentAt ?? conversation.lastMessage.createdAt
          : undefined),
      ),
      unread: conversation.unreadCount ?? conversation.unread ?? 0,
      online: false,
      messages,
      latestMessage: typeof conversation.lastMessage === 'object' && conversation.lastMessage
        ? conversation.lastMessage
        : (conversation.lastMessageText
          ?? (typeof conversation.lastMessage === 'string' ? conversation.lastMessage : ''))
          ? {
              id: conversation.lastMessageId,
              content: conversation.lastMessageText
                ?? (typeof conversation.lastMessage === 'string' ? conversation.lastMessage : ''),
              createdAt: conversation.lastMessageAt ?? conversation.lastMessageTime,
            }
          : undefined,
      recipientId: conversation.otherUserId
        ?? conversation.participantId
        ?? conversation.userId
        ?? conversation.otherUser?.id
        ?? conversation.participant?.id
        ?? this.getOtherParticipantId(conversation),
      lastMessageId: conversation.lastMessageId
        ?? (typeof conversation.lastMessage === 'object' && conversation.lastMessage
          ? conversation.lastMessage.id
          : undefined),
    };
  }

  private mapMessage(message: ConversationMessageDto, index: number): Message {
    return {
      id: message.id ?? index + 1,
      text: message.text ?? message.content ?? message.message ?? '',
      time: message.time ?? message.sentAt ?? message.createdAt ?? '',
      fromMe: message.fromMe ?? message.isFromMe
        ?? (message.senderId !== undefined && String(message.senderId) === String(this.getCurrentUserId())),
    };
  }

  private mergeLatestMessage(
    conversation: Conversation,
    history: ConversationMessageDto[],
  ): Message[] {
    const latest = this.getLatestMessage(conversation);
    if (!latest) {
      return history.map((message, index) => this.mapMessage(message, index));
    }

    const previousMessages = history.filter(message => {
      if (latest.id !== undefined && message.id !== undefined) {
        return String(message.id) !== String(latest.id);
      }

      const latestTime = latest.createdAt ?? latest.sentAt ?? latest.time;
      const messageTime = message.createdAt ?? message.sentAt ?? message.time;
      const latestContent = latest.content ?? latest.text ?? latest.message;
      const messageContent = message.content ?? message.text ?? message.message;

      return !latestTime || !messageTime || latestTime !== messageTime || latestContent !== messageContent;
    });
    const messages = previousMessages.map((message, index) => this.mapMessage(message, index));
    return [...messages, this.mapMessage(latest, messages.length)];
  }

  private getLatestMessage(conversation: Conversation): ConversationMessageDto | null {
    return conversation.latestMessage ?? null;
  }

  private getOtherParticipantId(conversation: ConversationDto): number | string | undefined {
    if (conversation.senderId === undefined || conversation.receiverId === undefined) {
      return conversation.receiverId ?? conversation.senderId;
    }

    const currentUserId = this.getCurrentUserId();
    if (currentUserId === null) {
      return conversation.receiverId;
    }

    return String(conversation.senderId) === String(currentUserId)
      ? conversation.receiverId
      : conversation.senderId;
  }

  private formatConversationTime(value?: string): string {
    if (!value) {
      return '';
    }

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return value;
    }

    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1) {
      return 'Now';
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d` : new Date(timestamp).toLocaleDateString();
  }

  private getCurrentUserId(): number | string | null {
    const userDetails = localStorage.getItem('userdetails');
    if (!userDetails) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(userDetails);
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      const details = parsed as Record<string, unknown>;
      const user = typeof details['user'] === 'object' && details['user'] !== null
        ? details['user'] as Record<string, unknown>
        : details;
      const userId = user['id'] ?? user['userId'] ?? details['userId'];
      return typeof userId === 'number' || typeof userId === 'string' ? userId : null;
    } catch (error) {
      console.error('Failed to read the signed-in user details:', error);
      return null;
    }
  }
}
