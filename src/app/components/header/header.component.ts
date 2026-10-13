import { Component, output } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
 username =    localStorage.getItem('userdetails')
      ? JSON.parse(localStorage.getItem('userdetails')!).username
      : null;
  notify = output<void>();
  profile = output<void>();
}
