import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MySkillsComponent } from './pages/my-skills/my-skills';
import { MyRequestsComponent } from './pages/my-requests/my-requests.component';
import { MySessionsComponent } from './pages/my-session/my-session';
import { MessagesComponent } from './pages/messages/messages';
import { ExploreSkillsComponent } from './pages/explore-skills/explore-skills';
import { NotificationsComponent } from './pages/notifications/notifications';
import { ProfileComponent } from './pages/profile/profile';
import { SettingsComponent } from './pages/settings/settings';
import { redirectSignedInUser, requireAuth } from './shared/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login, canActivate: [redirectSignedInUser], title: 'Login | SkillSwap' },
  { path: 'register', component: Register, title: 'Register | SkillSwap' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [requireAuth], title: 'Dashboard | SkillSwap' },
  { path: 'my-skills', component: MySkillsComponent, canActivate: [requireAuth], title: 'My Skills | SkillSwap' },
  { path: 'my-requests', component: MyRequestsComponent, canActivate: [requireAuth], title: 'My Requests | SkillSwap' },
  { path: 'my-sessions', component: MySessionsComponent, canActivate: [requireAuth], title: 'My Sessions | SkillSwap' },
  { path: 'messages', component: MessagesComponent, canActivate: [requireAuth], title: 'Messages | SkillSwap' },
  { path: 'explore-skills', component: ExploreSkillsComponent, canActivate: [requireAuth], title: 'Explore Skills | SkillSwap' },
  { path: 'notifications', component: NotificationsComponent, canActivate: [requireAuth], title: 'Notifications | SkillSwap' },
  { path: 'profile', component: ProfileComponent, canActivate: [requireAuth], title: 'Profile | SkillSwap' },
  { path: 'settings', component: SettingsComponent, canActivate: [requireAuth], title: 'Settings | SkillSwap' },
  { path: '**', redirectTo: 'messages' },
];