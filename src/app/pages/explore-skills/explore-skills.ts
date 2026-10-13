import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { LearningSkill, LearningSkillService } from '../../services/learning-skill.service';
import { SkillService, SkillUser, UserSkill } from '../../services/skill.service';
import { CreateSwapRequest, SwapRequestService } from '../../services/swap-request.service';
type Category = 'All' | 'Design' | 'Development' | 'Business' | 'Photography' | 'Languages' | 'Music' | 'Others';

type UserSkillProfile = {
  knownSkills: UserSkill[];
  learningSkills: LearningSkill[];
  knownSkillsLoading: boolean;
  learningSkillsLoading: boolean;
  knownSkillsError: boolean;
  learningSkillsError: boolean;
};

type RequestState = {
  loading: boolean;
  sent: boolean;
  error: string;
};

type Skill = {
  id: number;
  name: string;
  category: Exclude<Category, 'All'>;
  shortName: string;
  color: string;
  learners: number;
  description: string;
  people: string[];
};

@Component({
  selector: 'app-explore-skills',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './explore-skills.html',
  styleUrl: './explore-skills.css',
})
export class ExploreSkillsComponent {
  activeCategory = signal<Category>('All');
  search = signal('');
  selectedSkill = signal<Skill | null>(null);
  skillUsers = signal<SkillUser[]>([]);
  userSkillProfiles = signal<Record<string, UserSkillProfile>>({});
  requestSelections = signal<Record<string, string>>({});
  requestStates = signal<Record<string, RequestState>>({});
  usersLoading = signal(false);
  usersLoaded = signal(false);
  usersError = signal('');

  categories: Category[] = ['All', 'Design', 'Development', 'Business', 'Photography', 'Languages', 'Music', 'Others'];

  skills = signal<Skill[]>([
    { id: 1, name: 'UI/UX Design', category: 'Design', shortName: 'UI', color: 'pink', learners: 230, description: 'Learn design principles, wireframing, prototyping and user research.', people: ['A', 'P', 'S'] },
    { id: 2, name: 'Angular', category: 'Development', shortName: 'A', color: 'red', learners: 180, description: 'Build dynamic web applications using the Angular framework.', people: ['R', 'V', 'A'] },
    { id: 3, name: 'Python', category: 'Development', shortName: 'Py', color: 'python', learners: 160, description: 'Learn Python programming from basics to advanced concepts.', people: ['N', 'P', 'K'] },
    { id: 4, name: 'Photography', category: 'Photography', shortName: 'Cam', color: 'purple', learners: 120, description: 'Explore photography techniques, editing and creative shots.', people: ['S', 'M', 'R'] },
    { id: 5, name: 'JavaScript', category: 'Development', shortName: 'JS', color: 'yellow', learners: 140, description: 'Master JavaScript from fundamentals to advanced concepts.', people: ['A', 'R', 'V'] },
    { id: 6, name: 'React', category: 'Development', shortName: 'R', color: 'cyan', learners: 110, description: 'Build modern web apps with React and Hooks.', people: ['P', 'N', 'S'] },
    { id: 7, name: 'Node.js', category: 'Development', shortName: 'JS', color: 'green', learners: 85, description: 'Build scalable server-side applications with Node.js.', people: ['V', 'A', 'K'] },
    { id: 8, name: 'Machine Learning', category: 'Development', shortName: 'ML', color: 'violet', learners: 70, description: 'Understand ML concepts and build real-world models.', people: ['R', 'P', 'M'] },
    { id: 9, name: 'Excel', category: 'Business', shortName: 'X', color: 'excel', learners: 65, description: 'Master Excel for data analysis and productivity.', people: ['N', 'S', 'A'] },
  ]);

  filteredSkills = computed<Skill[]>(() => {
    const category = this.activeCategory();
    const query = this.search().trim().toLowerCase();
    return this.skills().filter((skill: Skill) => {
      const matchesCategory = category === 'All' || skill.category === category;
      const matchesSearch = !query || skill.name.toLowerCase().includes(query) || skill.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  });

  constructor(
    private router: Router,
    private skillService: SkillService,
    private learningSkillService: LearningSkillService,
    private swapRequestService: SwapRequestService,
  ) {}

  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  openDetails(skill: Skill): void {
    this.selectedSkill.set(skill);
    this.skillUsers.set([]);
    this.userSkillProfiles.set({});
    this.requestSelections.set({});
    this.requestStates.set({});
    this.usersLoading.set(false);
    this.usersLoaded.set(false);
    this.usersError.set('');
  }

  startLearning(skill: Skill): void {
    if (this.usersLoading() || this.usersLoaded()) {
      return;
    }

    this.usersLoading.set(true);
    this.usersError.set('');
    this.skillService.getUsersBySkill(skill.name).subscribe({
      next: (users) => {
        this.skillUsers.set(users);
        this.loadUserSkillProfiles(users);
        this.usersLoaded.set(true);
        this.usersLoading.set(false);
      },
      error: () => {
        this.usersError.set('Unable to load learners for this skill. Please try again.');
        this.usersLoading.set(false);
      },
    });
  }

  closeDetails(): void {
    this.selectedSkill.set(null);
    this.skillUsers.set([]);
    this.userSkillProfiles.set({});
    this.requestSelections.set({});
    this.requestStates.set({});
    this.usersLoading.set(false);
    this.usersLoaded.set(false);
    this.usersError.set('');
  }

  getSkillUserName(user: SkillUser): string {
    return user.fullName || user.name || user.username || 'Learner';
  }

  getUserSkillProfile(user: SkillUser): UserSkillProfile | undefined {
    const userId = this.getSkillUserId(user);
    return userId === null ? undefined : this.userSkillProfiles()[String(userId)];
  }

  private loadUserSkillProfiles(users: SkillUser[]): void {
    for (const user of users) {
      const userId = this.getSkillUserId(user);
      if (userId === null) {
        console.error('Unable to load skill details for learner without a user ID:', user);
        continue;
      }

      const profileKey = String(userId);
      this.userSkillProfiles.update(profiles => ({
        ...profiles,
        [profileKey]: {
          knownSkills: [],
          learningSkills: [],
          knownSkillsLoading: true,
          learningSkillsLoading: true,
          knownSkillsError: false,
          learningSkillsError: false,
        },
      }));

      this.skillService.getMySkills(userId).subscribe({
        next: knownSkills => this.updateUserSkillProfile(profileKey, {
          knownSkills,
          knownSkillsLoading: false,
        }),
        error: error => {
          console.error(`Failed to load known skills for learner ${profileKey}:`, error);
          this.updateUserSkillProfile(profileKey, {
            knownSkillsError: true,
            knownSkillsLoading: false,
          });
        },
      });

      this.learningSkillService.getMyLearningSkills(userId).subscribe({
        next: learningSkills => this.updateUserSkillProfile(profileKey, {
          learningSkills,
          learningSkillsLoading: false,
        }),
        error: error => {
          console.error(`Failed to load learning skills for learner ${profileKey}:`, error);
          this.updateUserSkillProfile(profileKey, {
            learningSkillsError: true,
            learningSkillsLoading: false,
          });
        },
      });
    }
  }

  private updateUserSkillProfile(key: string, changes: Partial<UserSkillProfile>): void {
    this.userSkillProfiles.update(profiles => {
      const profile = profiles[key];
      return profile ? { ...profiles, [key]: { ...profile, ...changes } } : profiles;
    });
  }

  getSkillUserId(user: SkillUser): number | string | null {
    const userId = user.userId ?? user.id;
    return typeof userId === 'number' || (typeof userId === 'string' && userId.trim())
      ? userId
      : null;
  }

  getSelectedSkillToOffer(user: SkillUser): string {
    const key = this.getRequestKey(user);
    return key ? this.requestSelections()[key] ?? '' : '';
  }

  selectSkillToOffer(user: SkillUser, skillName: string): void {
    const key = this.getRequestKey(user);
    if (!key) {
      return;
    }

    this.requestSelections.update(selections => ({ ...selections, [key]: skillName }));
    this.updateRequestState(key, { error: '' });
  }

  getRequestState(user: SkillUser): RequestState {
    const key = this.getRequestKey(user);
    return key
      ? this.requestStates()[key] ?? { loading: false, sent: false, error: '' }
      : { loading: false, sent: false, error: 'Learner ID unavailable.' };
  }

  sendRequest(user: SkillUser, skillWanted: string): void {
    const receiverId = this.getSkillUserId(user);
    const skillOffered = this.getSelectedSkillToOffer(user);
    const state = this.getRequestState(user);
    const senderId = this.getCurrentUserId();
    const key = this.getRequestKey(user);

    if (!key || receiverId === null || senderId === null || !skillOffered || !skillWanted || state.loading || state.sent) {
      if (key && senderId === null) {
        this.updateRequestState(key, { error: 'Unable to identify your account. Please sign in again.' });
      }
      return;
    }

    const request: CreateSwapRequest = {
      senderId,
      receiverId,
      skillOffered,
      skillWanted,
    };

    this.updateRequestState(key, { loading: true, error: '' });
    this.swapRequestService.createRequest(request).subscribe({
      next: () => this.updateRequestState(key, { loading: false, sent: true }),
      error: error => {
        console.error('Failed to send skill request:', error);
        this.updateRequestState(key, {
          loading: false,
          error: 'Failed to send request. Please try again.',
        });
      },
    });
  }

  private getRequestKey(user: SkillUser): string | null {
    const userId = this.getSkillUserId(user);
    return userId === null ? null : String(userId);
  }

  private updateRequestState(key: string, changes: Partial<RequestState>): void {
    this.requestStates.update(states => {
      const current = states[key];
      return {
        ...states,
        [key]: {
          loading: changes.loading ?? current?.loading ?? false,
          sent: changes.sent ?? current?.sent ?? false,
          error: changes.error ?? current?.error ?? '',
        },
      };
    });
  }

  private getCurrentUserId(): number | string | null {
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
