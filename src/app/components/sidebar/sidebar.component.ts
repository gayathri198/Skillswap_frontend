import { Component, input, output } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  navigate = output<string>();
  initialActive = input('Dashboard');
  activeItem = 'Dashboard';
  navItems = [
    { label: 'Dashboard', icon: 'home' },
    { label: 'Explore Skills', icon: 'search' },
    { label: 'My Requests', icon: 'send' },
    { label: 'My Sessions', icon: 'calendar' },
    { label: 'My Skills', icon: 'book' },
    { label: 'Messages', icon: 'message', badge: '2' },
    { label: 'Notifications', icon: 'bell', badge: '4' },
    { label: 'Profile', icon: 'user' },
    { label: 'Settings', icon: 'settings' },
  ];

  ngOnInit(): void {
    this.activeItem = this.initialActive();
  }

  onSelect(label: string): void {
    this.activeItem = label;
    this.navigate.emit(label);
  }
}
