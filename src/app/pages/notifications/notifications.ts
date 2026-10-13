import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';

type NotificationKind = 'success' | 'request' | 'message' | 'update';
type NotificationTab = 'All' | 'Read';

type NotificationItem = {
  id: number;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  read: boolean;
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [AppIcon, SidebarComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  activeTab = signal<NotificationTab>('All');

  notifications = signal<NotificationItem[]>([
    {
      id: 1,
      kind: 'success',
      title: 'Priya Sharma accepted your skill request.',
      detail: 'UI/UX Design · 12:00 AM',
      time: 'Just now',
      read: false,
    },
    {
      id: 2,
      kind: 'request',
      title: 'Python Basics from Vikram R.',
      detail: 'New skill request from Vikram R. · 12:00 PM',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 3,
      kind: 'message',
      title: 'Priya Sharma sent you a message.',
      detail: "Priya Sharma sent you a message. There's the name done later.",
      time: 'Yesterday',
      read: false,
    },
    {
      id: 4,
      kind: 'update',
      title: 'SkillSwap platform update: New profile features available.',
      detail: 'SkillSwap platform update: New profile features available. and got a new reward more.',
      time: '2 days ago',
      read: true,
    },
  ]);

  visibleNotifications = computed<NotificationItem[]>(() => {
    if (this.activeTab() === 'Read') {
      return this.notifications().filter((notification: NotificationItem) => notification.read);
    }
    return this.notifications();
  });

  unreadCount = computed(() =>
    this.notifications().filter((notification: NotificationItem) => !notification.read).length,
  );

  constructor(private router: Router) {}

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  markRead(id: number): void {
    this.notifications.update((items: NotificationItem[]) =>
      items.map((notification: NotificationItem) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  performAction(notification: NotificationItem, action: 'session' | 'request' | 'message' | 'learn'): void {
    this.markRead(notification.id);
    const routes: Record<string, string> = {
      session: '/my-sessions',
      request: '/my-requests',
      message: '/messages',
    };
    const path = routes[action];
    if (path) {
      this.router.navigate([path]);
    }
  }
}

