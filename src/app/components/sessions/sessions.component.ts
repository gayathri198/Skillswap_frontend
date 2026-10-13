import { Component } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.css',
})
export class SessionsComponent {
  sessions = [
    { name: 'UI/UX Design', with: 'Priya Sharma', date: '25 May 2025', time: '10:00 AM', initial: 'P', avatar: 'avatar-priya' },
    { name: 'Python Basics', with: 'Vikram R', date: '26 May 2025', time: '4:00 PM', initial: 'V', avatar: 'avatar-vikram' },
    { name: 'Photography', with: 'Sneha R', date: '27 May 2025', time: '2:00 PM', initial: 'S', avatar: 'avatar-sneha' },
  ];
}
