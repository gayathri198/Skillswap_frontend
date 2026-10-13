import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
type SessionStatus = 'Upcoming' | 'Completed' | 'Cancelled';
type Tab = 'Upcoming' | 'Completed' | 'Cancelled';

type Session = {
  id: number;
  skill: string;
  partner: string;
  avatar: string;
  date: string;
  time: string;
  duration: string;
  status: SessionStatus;
  mode: string;
};

@Component({
  selector: 'app-my-sessions',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './my-session.html',
  styleUrl: './my-session.css',
})
export class MySessionsComponent {
  activeTab = signal<Tab>('Upcoming');
  search = signal('');

  sessions = signal<Session[]>([
    { id: 1, skill: 'UI/UX Design', partner: 'Priya Nair', avatar: 'P', date: 'Sep 6, 2026', time: '10:00 AM', duration: '1 hour', status: 'Upcoming', mode: 'Online' },
    { id: 2, skill: 'Python Basics', partner: 'Vikram Roy', avatar: 'V', date: 'Sep 8, 2026', time: '4:00 PM', duration: '1.5 hours', status: 'Upcoming', mode: 'In-person' },
    { id: 3, skill: 'Angular', partner: 'Aarav Sharma', avatar: 'A', date: 'Sep 10, 2026', time: '2:00 PM', duration: '2 hours', status: 'Upcoming', mode: 'Online' },
    { id: 4, skill: 'Figma', partner: 'Sara Khan', avatar: 'S', date: 'Aug 28, 2026', time: '11:00 AM', duration: '1 hour', status: 'Completed', mode: 'Online' },
    { id: 5, skill: 'JavaScript', partner: 'Rohan Das', avatar: 'R', date: 'Aug 20, 2026', time: '3:00 PM', duration: '1.5 hours', status: 'Completed', mode: 'In-person' },
    { id: 6, skill: 'CSS', partner: 'Neha Gupta', avatar: 'N', date: 'Aug 15, 2026', time: '5:00 PM', duration: '1 hour', status: 'Completed', mode: 'Online' },
    { id: 7, skill: 'Photography', partner: 'Sneha R', avatar: 'S', date: 'Aug 12, 2026', time: '9:00 AM', duration: '2 hours', status: 'Cancelled', mode: 'In-person' },
  ]);

  tabs: Tab[] = ['Upcoming', 'Completed', 'Cancelled'];

  filtered = computed<Session[]>(() => {
    const tab = this.activeTab();
    const query = this.search().toLowerCase().trim();
    return this.sessions().filter((s: Session) => {
      const matchesTab = s.status === tab;
      const matchesSearch = !query || s.skill.toLowerCase().includes(query) || s.partner.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  });

  counts = computed(() => ({
    Upcoming: this.sessions().filter((s: Session) => s.status === 'Upcoming').length,
    Completed: this.sessions().filter((s: Session) => s.status === 'Completed').length,
    Cancelled: this.sessions().filter((s: Session) => s.status === 'Cancelled').length,
  }));

  constructor(private router: Router) {}
    handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

 

  cancelSession(id: number): void {
    this.sessions.update((list: Session[]) => list.map((s: Session) => s.id === id ? { ...s, status: 'Cancelled' as SessionStatus } : s));
    this.activeTab.set('Cancelled');
  }

  joinSession(id: number): void {
    this.router.navigate(['/my-sessions', id]);
  }

  statusClass(status: SessionStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}
