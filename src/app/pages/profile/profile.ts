import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { SkillService, UserSkill } from '../../services/skill.service';
import { SwapRequestDto, SwapRequestService } from '../../services/swap-request.service';

type ProfileSkill = {
  name: string;
  level: string;
};

type ActiveRequest = {
  id: number;
  skill: string;
  partner: string;
  avatar: string;
};

type UserProfile = {
  id: number | string;
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  bio: string;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  isEditing = signal(false);
  savedNotice = signal(false);
  profile = signal<UserProfile | null>(null);
  profileError = signal('');
  skillsLoading = signal(false);
  skillsError = signal('');
  profileSkills = signal<ProfileSkill[]>([]);
  requestsLoading = signal(false);
  requestsError = signal('');
  private requests = signal<SwapRequestDto[]>([]);
  phone = '';
  bio = '';

  activeRequests = computed<ActiveRequest[]>(() => {
    const userId = this.profile()?.id;
    if (userId === undefined) {
      return [];
    }

    return this.requests()
      .filter(request =>
        String(request.senderId) === String(userId) || String(request.receiverId) === String(userId)
      )
      .filter(request => request.status === 'Pending' || request.status === 'Accepted')
      .map(request => {
        const isSent = String(request.senderId) === String(userId);
        const partner = isSent ? request.receiverName : request.senderName;
        return {
          id: request.id,
          skill: isSent ? request.skillWanted : request.skillOffered,
          partner,
          avatar: partner.trim().charAt(0).toUpperCase() || '?',
        };
      });
  });

  constructor(
    private router: Router,
    private skillService: SkillService,
    private swapRequestService: SwapRequestService,
  ) {
    this.loadProfile();
  }

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  toggleEdit(): void {
    this.isEditing.update((editing: boolean) => !editing);
    this.savedNotice.set(false);
  }

  saveProfile(): void {
    this.isEditing.set(false);
    this.savedNotice.set(true);
    window.setTimeout(() => this.savedNotice.set(false), 2800);
  }

  getInitial(): string {
    return this.profile()?.fullName.trim().charAt(0).toUpperCase() || '?';
  }

  private loadProfile(): void {
    const storedDetails = localStorage.getItem('userdetails');
    if (!storedDetails) {
      this.profileError.set('Unable to load your profile. Please sign in again.');
      return;
    }

    try {
      const parsed: unknown = JSON.parse(storedDetails);
      if (typeof parsed !== 'object' || parsed === null) {
        this.profileError.set('Your saved account details are invalid. Please sign in again.');
        return;
      }

      const response = parsed as Record<string, unknown>;
      const user = typeof response['user'] === 'object' && response['user'] !== null
        ? response['user'] as Record<string, unknown>
        : response;
      const userId = user['id'] ?? response['userId'];
      if (typeof userId !== 'number' && (typeof userId !== 'string' || !userId.trim())) {
        this.profileError.set('Unable to identify your account. Please sign in again.');
        return;
      }

      const profileData = { ...response, ...user };
      const profile: UserProfile = {
        id: userId,
        fullName: this.readString(profileData, 'fullName') || this.readString(profileData, 'name'),
        username: this.readString(profileData, 'username'),
        email: this.readString(profileData, 'email'),
        mobileNumber: this.readString(profileData, 'mobileNumber') || this.readString(profileData, 'phone'),
        role: this.readString(profileData, 'role') || 'User',
        bio: this.readString(profileData, 'bio'),
      };
      this.profile.set(profile);
      this.phone = profile.mobileNumber;
      this.bio = profile.bio;
      this.loadSkills(userId);
      this.loadRequests(userId);
    } catch (error) {
      console.error('Failed to read the signed-in user details:', error);
      this.profileError.set('Unable to read your profile details. Please sign in again.');
    }
  }

  private loadSkills(userId: number | string): void {
    this.skillsLoading.set(true);
    this.skillService.getMySkills(userId).subscribe({
      next: skills => {
        this.profileSkills.set(skills.map((skill: UserSkill) => ({
          name: skill.skillName,
          level: skill.skillLevel || skill.skillType,
        })));
        this.skillsLoading.set(false);
      },
      error: error => {
        console.error('Failed to load profile skills:', error);
        this.skillsError.set('Unable to load your skills.');
        this.skillsLoading.set(false);
      },
    });
  }

  private loadRequests(userId: number | string): void {
    this.requestsLoading.set(true);
    this.swapRequestService.getMyRequests(userId).subscribe({
      next: requests => {
        this.requests.set(requests);
        this.requestsLoading.set(false);
      },
      error: error => {
        console.error('Failed to load profile requests:', error);
        this.requestsError.set('Unable to load your active requests.');
        this.requestsLoading.set(false);
      },
    });
  }

  private readString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    return typeof value === 'string' ? value : '';
  }
}
