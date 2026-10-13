import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { StatsComponent } from '../../components/stats/stats.component';
import { ActivityComponent } from '../../components/activity/activity.component';
import { SessionsComponent } from '../../components/sessions/sessions.component';
import { SkillsComponent } from '../../components/skills/skills.component';
import { RecommendedComponent } from '../../components/recommended/recommended.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    StatsComponent,
    ActivityComponent,
    SessionsComponent,
    SkillsComponent,
    RecommendedComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  notice = signal('');

  constructor(private router: Router) {}

 handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }
}