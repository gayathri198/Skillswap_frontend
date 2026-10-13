import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { UserService } from '../../services/user.service';

type SettingsSection = 'Account' | 'Change Password' | 'Notifications' | 'Appearance' | 'Privacy';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  activeSection = signal<SettingsSection>('Account');
  savedNotice = signal(false);
  passwordSuccess = signal('');
  passwordError = signal('');
  isChangingPassword = signal(false);
  fullName = '';
  username = '';
  email = '';
  mobileNumber = '';
  role = 'Learner';
  language = 'English';
  timeZone = 'Asia/Kolkata';
  theme = 'Light';
  emailNotifications = true;
  messageNotifications = true;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  sections: { label: SettingsSection; icon: string }[] = [
    { label: 'Account', icon: 'user' },
    { label: 'Change Password', icon: 'lock' },
    { label: 'Notifications', icon: 'bell' },
    { label: 'Appearance', icon: 'palette' },
    { label: 'Privacy', icon: 'shield' },
  ];

  constructor(
    private router: Router,
    private userService: UserService,
  ) {
    this.loadUserDetails();
  }

  getInitial(): string {
    return (this.fullName || this.username).trim().charAt(0).toUpperCase() || '?';
  }

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  selectSection(section: SettingsSection): void {
    this.activeSection.set(section);
  }

  saveSettings(): void {
    this.savedNotice.set(true);
    window.setTimeout(() => this.savedNotice.set(false), 2800);
  }

  changePassword(event?: Event): void {
    event?.preventDefault();
    this.passwordSuccess.set('');
    this.passwordError.set('');

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError.set('Complete all password fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('The new password and confirmation do not match.');
      return;
    }

    if (this.isChangingPassword()) {
      return;
    }

    this.isChangingPassword.set(true);
    this.userService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess.set('Your password has been updated.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isChangingPassword.set(false);
      },
      error: error => {
        console.error('Failed to change password:', error);
        this.passwordError.set('Failed to update password. Check your current password and try again.');
        this.isChangingPassword.set(false);
      },
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToSessions(): void {
    this.router.navigate(['/my-sessions']);
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
      this.fullName = this.readString(user, 'fullName') || this.readString(user, 'name');
      this.username = this.readString(user, 'username');
      this.email = this.readString(user, 'email');
      this.mobileNumber = this.readString(user, 'mobileNumber') || this.readString(user, 'phone');
      this.role = this.readString(user, 'role') || this.readString(response, 'role') || 'Learner';
    } catch (error) {
      console.error('Failed to read the signed-in user details:', error);
    }
  }

  private readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return typeof value === 'string' ? value : '';
  }
}
