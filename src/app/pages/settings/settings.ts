import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';

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
  fullName = 'Gayathri';
  username = 'gayathri123';
  email = 'gayathri@gmail.com';
  mobileNumber = '9876543210';
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

  constructor(private router: Router) {}

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

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToSessions(): void {
    this.router.navigate(['/my-sessions']);
  }
}
