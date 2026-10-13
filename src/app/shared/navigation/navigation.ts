import { Router } from '@angular/router';

const routes: Record<string, string> = {
  Dashboard: '/dashboard',
  'Explore Skills': '/explore-skills',
  Notifications: '/notifications',
  Profile: '/profile',
  Settings: '/settings',
  'My Requests': '/my-requests',
  'My Sessions': '/my-sessions',
  'My Skills': '/my-skills',
  Messages: '/messages',
  Logout: '/login',
};

export function navigateByLabel(router: Router, label: string): void {
  const path = routes[label];
  if (path) {
    if (label === 'Logout') {
      localStorage.clear();
      sessionStorage.clear();
    }

    router.navigate([path]);
  }
}
