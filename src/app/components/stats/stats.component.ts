import { Component, computed, output, signal } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SkillService } from '../../services/skill.service';
import { SwapRequestService } from '../../services/swap-request.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css',
})
export class StatsComponent {
  mySkillsCount = signal('...');
  sentRequestsCount = signal('...');
  receivedRequestsCount = signal('...');
  completedSessionsCount = computed(() =>
    this.sessionService.sessions().filter(session => session.status === 'Completed').length.toString()
  );
  stats = [
    { label: 'My Skills', value: '', detail: 'Skills Added', icon: 'book', theme: 'blue' },
    { label: 'Requests Sent', value: '', detail: 'Total Sent', icon: 'send', theme: 'green' },
    { label: 'Requests Received', value: '', detail: 'Total Received', icon: 'book', theme: 'orange' },
    { label: 'Sessions Completed', value: '', detail: 'Total Completed', icon: 'calendar', theme: 'violet' },
  ];
  navigate = output<string>();

  constructor(
    private skillService: SkillService,
    private swapRequestService: SwapRequestService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const userId = this.getUserId();
    if (userId === null) {
      console.error('Unable to load dashboard counts: signed-in user ID is unavailable.');
      this.mySkillsCount.set('-');
      this.sentRequestsCount.set('-');
      this.receivedRequestsCount.set('-');
      return;
    }

    this.skillService.getMySkills(userId).subscribe({
      next: skills => {
        this.mySkillsCount.set(skills.length.toString());
      },
      error: error => {
        console.error('Failed to load dashboard skill count:', error);
        this.mySkillsCount.set('-');
      },
    });

    this.swapRequestService.getMyRequests(userId).subscribe({
      next: requests => {
        const sentCount = requests.filter(request => String(request.senderId) === String(userId)).length;
        this.sentRequestsCount.set(sentCount.toString());
        const receivedCount = requests.filter(request => String(request.receiverId) === String(userId)).length;
        this.receivedRequestsCount.set(receivedCount.toString());
      },
      error: error => {
        console.error('Failed to load dashboard request counts:', error);
        this.sentRequestsCount.set('-');
        this.receivedRequestsCount.set('-');
      },
    });
  }

  private getUserId(): number | string | null {
    const storedDetails = localStorage.getItem('userdetails');
    if (!storedDetails) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(storedDetails);
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      const details = parsed as Record<string, unknown>;
      const user = typeof details['user'] === 'object' && details['user'] !== null
        ? details['user'] as Record<string, unknown>
        : details;
      const userId = user['id'] ?? user['userId'] ?? details['userId'];

      return typeof userId === 'number' || (typeof userId === 'string' && userId.trim())
        ? userId
        : null;
    } catch (error) {
      console.error('Failed to read the signed-in user details:', error);
      return null;
    }
  }
}
