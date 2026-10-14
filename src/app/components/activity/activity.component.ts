import { Component, computed, signal } from '@angular/core';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SkillService } from '../../services/skill.service';
import { SwapRequestDto, SwapRequestService } from '../../services/swap-request.service';
import { SessionService } from '../../services/session.service';

type ActivityItem = {
  id: string;
  text: string;
  time: string | null;
  timestamp: number | null;
  icon: string;
  theme: string;
};

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css',
})
export class ActivityComponent {
  private skills = signal<{ id: number; name: string }[]>([]);
  private requests = signal<SwapRequestDto[]>([]);
  skillError = signal(false);
  requestError = signal(false);
  showAll = signal(false);

  activities = computed<ActivityItem[]>(() => {
    const userId = this.getUserId();
    if (userId === null) {
      return [];
    }

    const items: ActivityItem[] = [
      ...this.skills().map(skill => ({
        id: `skill-${skill.id}`,
        text: `You added ${skill.name} to Skills I Know`,
        time: 'In Skills I Know',
        timestamp: null,
        icon: 'book',
        theme: 'lavender',
      })),
      ...this.requests().map(request => this.requestActivity(request, userId)),
      ...this.sessionService.sessions()
        .filter(session => session.status === 'Completed')
        .map(session => {
          const timestamp = Date.parse(session.date);
          return {
            id: `session-${session.id}`,
            text: `Session with ${session.partner} for ${session.skill} completed`,
            time: Number.isNaN(timestamp) ? null : this.timeAgo(timestamp),
            timestamp: Number.isNaN(timestamp) ? null : timestamp,
            icon: 'calendar',
            theme: 'peach',
          };
        }),
    ];

    return items.sort((first, second) =>
      (second.timestamp ?? 0) - (first.timestamp ?? 0)
    );
  });

  visibleActivities = computed(() =>
    this.showAll() ? this.activities() : this.activities().slice(0, 5)
  );

  constructor(
    private skillService: SkillService,
    private swapRequestService: SwapRequestService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const userId = this.getUserId();
    if (userId === null) {
      console.error('Unable to load dashboard activity: signed-in user ID is unavailable.');
      this.skillError.set(true);
      this.requestError.set(true);
      return;
    }

    this.skillService.getMySkills(userId).subscribe({
      next: skills => this.skills.set(skills.map(skill => ({
        id: skill.id,
        name: skill.skillName,
      }))),
      error: error => {
        console.error('Failed to load skills for dashboard activity:', error);
        this.skillError.set(true);
      },
    });

    this.swapRequestService.getMyRequests(userId).subscribe({
      next: requests => this.requests.set(requests),
      error: error => {
        console.error('Failed to load requests for dashboard activity:', error);
        this.requestError.set(true);
      },
    });
  }

  toggleShowAll(): void {
    this.showAll.update(showAll => !showAll);
  }

  private requestActivity(request: SwapRequestDto, userId: number | string): ActivityItem {
    const sent = String(request.senderId) === String(userId);
    const partner = sent ? request.receiverName : request.senderName;
    const timestamp = Date.parse(request.createdAt);
    const hasTimestamp = request.status === 'Pending' && !Number.isNaN(timestamp);
    let text: string;
    let icon = sent ? 'send' : 'user';
    let theme = sent ? 'mint' : 'lavender';

    switch (request.status) {
      case 'Accepted':
        text = sent
          ? `Your request to ${partner} for ${request.skillWanted} was accepted`
          : `You accepted ${partner}'s request for ${request.skillOffered}`;
        break;
      case 'Declined':
        text = sent
          ? `Your request to ${partner} for ${request.skillWanted} was declined`
          : `You declined ${partner}'s request for ${request.skillOffered}`;
        theme = 'rose';
        break;
      case 'Completed':
        text = `Skill swap with ${partner} for ${sent ? request.skillWanted : request.skillOffered} completed`;
        icon = 'calendar';
        theme = 'peach';
        break;
      default:
        text = sent
          ? `You sent a request to ${partner} for ${request.skillWanted}`
          : `You received a request from ${partner} for ${request.skillOffered}`;
    }

    return {
      id: `request-${request.id}`,
      text,
      time: hasTimestamp ? this.timeAgo(timestamp) : null,
      timestamp: hasTimestamp ? timestamp : null,
      icon,
      theme,
    };
  }

  private timeAgo(timestamp: number): string {
    const difference = Date.now() - timestamp;
    if (difference < 0) {
      const days = Math.ceil(Math.abs(difference) / 86_400_000);
      return days < 1 ? 'Later today' : `In ${days} day${days === 1 ? '' : 's'}`;
    }
    if (difference < 60 * 60 * 1000) {
      const minutes = Math.floor(difference / 60_000);
      return minutes < 1 ? 'Just now' : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (difference < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(difference / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(difference / (24 * 60 * 60 * 1000));
    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
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
