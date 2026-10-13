import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { SwapRequestDto, SwapRequestService, SwapRequestStatus } from '../../services/swap-request.service';

type RequestStatus = SwapRequestStatus;
type Tab = 'All' | 'Sent' | 'Received';

type SwapRequest = {
  id: number;
  person: string;
  avatar: string;
  skillOffered: string;
  skillWanted: string;
  date: string;
  status: RequestStatus;
  direction: 'sent' | 'received';
};

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.css',
})
export class MyRequestsComponent {
  activeTab = signal<Tab>('All');
  search = signal('');
  requests = signal<SwapRequest[]>([]);
  isLoading = signal(true);
  loadError = signal('');
  actionError = signal('');
  private readonly pendingActions = signal<number[]>([]);

  tabs: Tab[] = ['All', 'Sent', 'Received'];

  filtered = computed<SwapRequest[]>(() => {
    const tab = this.activeTab();
    const query = this.search().toLowerCase().trim();
    return this.requests().filter((r: SwapRequest) => {
      const matchesTab = tab === 'All' || (tab === 'Sent' && r.direction === 'sent') || (tab === 'Received' && r.direction === 'received');
      const matchesSearch = !query || r.person.toLowerCase().includes(query) || r.skillOffered.toLowerCase().includes(query) || r.skillWanted.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  });

  counts = computed(() => ({
    All: this.requests().length,
    Sent: this.requests().filter((r: SwapRequest) => r.direction === 'sent').length,
    Received: this.requests().filter((r: SwapRequest) => r.direction === 'received').length,
  }));

  constructor(
    private router: Router,
    private swapRequestService: SwapRequestService,
  ) {
    this.loadRequests();
  }

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  loadRequests(): void {
    const userId = this.getUserId();
    if (userId === null) {
      this.isLoading.set(false);
      this.loadError.set('Unable to identify your account. Please sign in again.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set('');
    this.swapRequestService.getMyRequests(userId).subscribe({
      next: requests => {
        this.requests.set(requests.map(request => this.mapRequest(request, userId)));
        this.isLoading.set(false);
      },
      error: error => {
        console.error('Failed to load requests:', error);
        this.loadError.set('Failed to load requests. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  acceptRequest(id: number): void {
    this.updateRequestStatus(id, 'Accepted');
  }

  declineRequest(id: number): void {
    this.updateRequestStatus(id, 'Declined');
  }

  cancelRequest(id: number): void {
    if (this.isActionPending(id)) {
      return;
    }

    this.actionError.set('');
    this.pendingActions.update(ids => [...ids, id]);
    this.swapRequestService.deleteRequest(id).pipe(
      finalize(() => this.pendingActions.update(ids => ids.filter(pendingId => pendingId !== id))),
    ).subscribe({
      next: () => this.requests.update(requests => requests.filter(request => request.id !== id)),
      error: error => {
        console.error('Failed to remove request:', error);
        this.actionError.set('Failed to remove the request. Please try again.');
      },
    });
  }

  statusClass(status: RequestStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  isActionPending(id: number): boolean {
    return this.pendingActions().includes(id);
  }

  private updateRequestStatus(id: number, status: 'Accepted' | 'Declined'): void {
    if (this.isActionPending(id)) {
      return;
    }

    this.actionError.set('');
    this.pendingActions.update(ids => [...ids, id]);
    this.swapRequestService.updateStatus(id, status).pipe(
      finalize(() => this.pendingActions.update(ids => ids.filter(pendingId => pendingId !== id))),
    ).subscribe({
      next: updatedRequest => {
        this.requests.update(requests => requests.map(request =>
          request.id === id ? { ...request, status: updatedRequest.status } : request
        ));
      },
      error: error => {
        console.error(`Failed to ${status.toLowerCase()} request:`, error);
        this.actionError.set(`Failed to ${status.toLowerCase()} the request. Please try again.`);
      },
    });
  }

  private mapRequest(request: SwapRequestDto, userId: number | string): SwapRequest {
    const isSent = String(request.senderId) === String(userId);
    const person = isSent ? request.receiverName : request.senderName;

    return {
      id: request.id,
      person,
      avatar: person.trim().charAt(0).toUpperCase() || '?',
      skillOffered: request.skillOffered,
      skillWanted: request.skillWanted,
      date: this.formatDate(request.createdAt),
      status: request.status,
      direction: isSent ? 'sent' : 'received',
    };
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  private getUserId(): number | string | null {
    const userDetails = localStorage.getItem('userdetails');
    if (!userDetails) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(userDetails);
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      const details = parsed as Record<string, unknown>;
      const user = details['user'];
      const userId = typeof user === 'object' && user !== null && 'id' in user
        ? user.id
        : details['userId'];

      return typeof userId === 'number' || (typeof userId === 'string' && userId.trim())
        ? userId
        : null;
    } catch (error) {
      console.error('Failed to read the signed-in user details:', error);
      return null;
    }
  }
}
