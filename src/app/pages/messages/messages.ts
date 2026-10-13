import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
type Message = {
  id: number;
  text: string;
  time: string;
  fromMe: boolean;
};

type Conversation = {
  id: number;
  name: string;
  avatar: string;
  skill: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
};

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent {
  activeId = signal(1);
  draft = signal('');

  conversations = signal<Conversation[]>([
    {
      id: 1,
      name: 'Priya Nair',
      avatar: 'P',
      skill: 'UI/UX Design',
      lastMessage: 'Sounds great! See you at the session.',
      time: '2m',
      unread: 2,
      online: true,
      messages: [
        { id: 1, text: 'Hi! Are we still on for the UI/UX session this weekend?', time: '10:30 AM', fromMe: false },
        { id: 2, text: 'Yes, absolutely! Saturday morning works for me.', time: '10:32 AM', fromMe: true },
        { id: 3, text: 'Great! Should I prepare any design references beforehand?', time: '10:33 AM', fromMe: false },
        { id: 4, text: 'That would be perfect. I will share a Figma file with you tonight.', time: '10:35 AM', fromMe: true },
        { id: 5, text: 'Sounds great! See you at the session.', time: '10:36 AM', fromMe: false },
      ],
    },
    {
      id: 2,
      name: 'Vikram Roy',
      avatar: 'V',
      skill: 'Python Basics',
      lastMessage: 'Thanks for the resources!',
      time: '1h',
      unread: 0,
      online: false,
      messages: [
        { id: 1, text: 'Hey, thanks for the Python resources you shared!', time: '9:15 AM', fromMe: false },
        { id: 2, text: 'No problem! Let me know if you need help with the exercises.', time: '9:20 AM', fromMe: true },
        { id: 3, text: 'Thanks for the resources!', time: '9:22 AM', fromMe: false },
      ],
    },
    {
      id: 3,
      name: 'Aarav Sharma',
      avatar: 'A',
      skill: 'Angular',
      lastMessage: 'Can we reschedule to next Tuesday?',
      time: '3h',
      unread: 1,
      online: true,
      messages: [
        { id: 1, text: 'I had a question about the Angular routing section.', time: 'Yesterday', fromMe: false },
        { id: 2, text: 'Sure, what did you want to ask?', time: 'Yesterday', fromMe: true },
        { id: 3, text: 'Can we reschedule to next Tuesday?', time: 'Yesterday', fromMe: false },
      ],
    },
    {
      id: 4,
      name: 'Sara Khan',
      avatar: 'S',
      skill: 'Figma',
      lastMessage: 'I just completed the Figma challenge!',
      time: '1d',
      unread: 0,
      online: false,
      messages: [
        { id: 1, text: 'I just completed the Figma challenge!', time: 'Mon', fromMe: false },
        { id: 2, text: 'That is awesome! I would love to see what you made.', time: 'Mon', fromMe: true },
      ],
    },
    {
      id: 5,
      name: 'Rohan Das',
      avatar: 'R',
      skill: 'React',
      lastMessage: 'Let me check my calendar and get back to you.',
      time: '2d',
      unread: 0,
      online: false,
      messages: [
        { id: 1, text: 'Are you free for a React pairing session this week?', time: 'Sun', fromMe: true },
        { id: 2, text: 'Let me check my calendar and get back to you.', time: 'Sun', fromMe: false },
      ],
    },
  ]);

  activeConversation = computed<Conversation | undefined>(() =>
    this.conversations().find((c: Conversation) => c.id === this.activeId()),
  );

  totalUnread = computed(() =>
    this.conversations().reduce((sum: number, c: Conversation) => sum + c.unread, 0),
  );

  constructor(private router: Router) {}
  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

 

  selectConversation(id: number): void {
    this.activeId.set(id);
    this.conversations.update((list: Conversation[]) =>
      list.map((c: Conversation) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  }

  sendMessage(event?: Event): void {
    event?.preventDefault();
    const text = this.draft().trim();
    if (!text) return;

    const conv = this.activeConversation();
    if (!conv) return;

    const newMessage: Message = {
      id: conv.messages.length + 1,
      text,
      time: 'Now',
      fromMe: true,
    };

    this.conversations.update((list: Conversation[]) =>
      list.map((c: Conversation) =>
        c.id === conv.id
          ? { ...c, messages: [...c.messages, newMessage], lastMessage: text, time: 'Now' }
          : c,
      ),
    );
    this.draft.set('');
  }
}

