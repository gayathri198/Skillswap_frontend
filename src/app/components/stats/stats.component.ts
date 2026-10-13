import { Component } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent {
  stats = [
    { label: 'My Skills', value: '0', detail: 'Skills Added', icon: 'book', theme: 'blue' },
    { label: 'Requests Sent', value: '12', detail: 'Total Sent', icon: 'send', theme: 'green' },
    { label: 'Requests Received', value: '5', detail: 'Total Received', icon: 'book', theme: 'orange' },
    { label: 'Sessions Completed', value: '7', detail: 'Total Completed', icon: 'calendar', theme: 'violet' },
  ];
  skill = localStorage.getItem('mySkills') ? JSON.parse(localStorage.getItem('mySkills')!).length : 0;

  ngOnInit(): void {
    this.stats[0].value = this.skill.toString();
  }
}
