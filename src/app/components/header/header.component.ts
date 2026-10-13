import { Component, output } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  username = 'there';
  fullName = 'Your account';
  role = 'Learner';
  notify = output<void>();
  profile = output<void>();

  constructor() {
    this.loadUserDetails();
  }

  getInitial(): string {
    return this.fullName.trim().charAt(0).toUpperCase() || '?';
  }

  private loadUserDetails(): void {
    const storedDetails = localStorage.getItem('userdetails');
    if (!storedDetails) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(storedDetails);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Saved user details are not an object.');
      }

      const response = parsed as Record<string, unknown>;
      const user = typeof response['user'] === 'object' && response['user'] !== null
        ? response['user'] as Record<string, unknown>
        : response;
      const username = this.readString(user, 'username') || this.readString(user, 'userName');
      const fullName = this.readString(user, 'fullName') || this.readString(user, 'name');

      this.username = username || fullName || 'there';
      this.fullName = fullName || username || 'Your account';
      this.role = this.readString(user, 'role') || this.readString(response, 'role') || 'Learner';
    } catch (error) {
      console.error('Failed to read the signed-in user details for the dashboard:', error);
    }
  }

  private readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return typeof value === 'string' ? value.trim() : '';
  }
}
