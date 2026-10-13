import { Component } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css',
})
export class ActivityComponent {
  activities = [
    { text: 'You received a request from Manoj for Angular', time: '2 hours ago', icon: 'user', theme: 'lavender' },
    { text: 'Your request to Priya for UI/UX Design was accepted', time: '1 day ago', icon: 'send', theme: 'mint' },
    { text: 'Session with Manoj completed', time: '2 days ago', icon: 'calendar', theme: 'peach' },
    { text: 'You left a review for Vikram', time: '3 days ago', icon: 'spark', theme: 'sky' },
    { text: 'Sneha accepted your request for Photography', time: '4 days ago', icon: 'message', theme: 'rose' },
  ];
}
