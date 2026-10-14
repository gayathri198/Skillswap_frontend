import { Component, computed, signal, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { SessionService, type Session, type SessionStatus } from '../../services/session.service';
type Tab = 'Upcoming' | 'Completed' | 'Cancelled';

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
  sessions: WritableSignal<Session[]>;

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

  constructor(
    private router: Router,
    private sessionService: SessionService,
  ) {
    this.sessions = this.sessionService.sessions;
  }
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
