
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppIcon } from '../../shared/app-icon/app-icon';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { navigateByLabel } from '../../shared/navigation/navigation';
import { LearningSkill, LearningSkillService } from '../../services/learning-skill.service';
import { SkillService } from '../../services/skill.service';

type Skill = {
  id: number;
  name: string;
  type: string;
  level: string;
};

type SkillType = 'beginner' | 'intermediate' | 'expert';

@Component({
  selector: 'app-my-skills',
  standalone: true,
  imports: [AppIcon, SidebarComponent, FormsModule],
  templateUrl: './my-skills.html',
  styleUrl: './my-skills.css',
})
export class MySkillsComponent {
  // Skills available in the dropdown
  availableSkills: string[] = [
    'Angular',
    'C#',
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'HTML',
    'CSS',
    'React',
    'Node.js',
    'ASP.NET Core',
    'PostgreSQL',
    'MongoDB',
    'UI/UX Design',
    'Figma',
    'Machine Learning',
    'Photography',
    'Excel',
  ];

  // Skills selected by the user
  skills = signal<Skill[]>([]);

  // Skills the user wants to learn
  learningSkills = signal<LearningSkill[]>([]);

  // Form visibility
  showAddForm = signal(false);
  showLearningForm = signal(false);

  // Add skill form values
  newSkill = '';
  newLevel: SkillType = 'expert';
  private readonly skillLevelScores: Record<SkillType, string> = {
    beginner: '1',
    intermediate: '3',
    expert: '5',
  };

  // Learning skill form value
  newLearningSkill = '';

  // Notification
  notice = signal('');

  constructor(
    private router: Router,
    private skillService: SkillService,
    private learningSkillService: LearningSkillService,
  ) {
    this.loadSkills();
    this.loadLearningSkills();
  }

  // Load the user's skills from the API
  private loadSkills(): void {
    const userId = this.getUserId();
    if (userId === null) {
      this.showNotice('Unable to identify your account. Please sign in again.');
      return;
    }

    this.skillService.getMySkills(userId).subscribe({
      next: skills => this.skills.set(skills.map(skill => ({
        id: skill.id,
        name: skill.skillName,
        type: skill.skillType,
        level: skill.skillLevel,
      }))),
      error: error => {
        console.error('Failed to load skills:', error);
        this.showNotice('Failed to load skills. Please try again.');
      },
    });
  }

  // Load the user's learning skills from the API
  private loadLearningSkills(): void {
    const userId = this.getUserId();
    if (userId === null) {
      this.showNotice('Unable to identify your account. Please sign in again.');
      return;
    }

    this.learningSkillService.getMyLearningSkills(userId).subscribe({
      next: skills => this.learningSkills.set(skills),
      error: error => {
        console.error('Failed to load learning skills:', error);
        this.showNotice('Failed to load learning skills. Please try again.');
      },
    });
  }

  // Sidebar navigation
  handleNavigation(label: string): void {
    navigateByLabel(this.router, label);
  }

  // Open Add Skill form
  openAddForm(): void {
    this.showAddForm.set(true);
  }

  // Add selected skill
  addSkill(): void {
    const name = this.newSkill.trim();

    if (!name) {
      this.showNotice('Please select a skill');
      return;
    }

    const userId = this.getUserId();
    if (userId === null) {
      this.showNotice('Unable to identify your account. Please sign in again.');
      return;
    }

    const alreadyExists = this.skills().some(
      skill => skill.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      this.showNotice('This skill has already been added');
      return;
    }

    this.skillService.addSkill({
      userId,
      skillName: name,
      skillType: this.newLevel,
      skillLevel: this.skillLevelScores[this.newLevel],
    }).subscribe({
      next: skill => {
        this.skills.update(skills => [
          ...skills,
          {
            id: skill.id,
            name: skill.skillName,
            type: skill.skillType,
            level: skill.skillLevel,
          },
        ]);

        this.newSkill = '';
        this.newLevel = 'expert';
        this.showAddForm.set(false);
        this.showNotice('Skill added successfully');
      },
      error: error => {
        console.error('Failed to add skill:', error);
        this.showNotice('Failed to save skills. Please try again.');
      },
    });
  }

  // Cancel Add Skill form
  cancelAdd(): void {
    this.newSkill = '';
    this.newLevel = 'expert';
    this.showAddForm.set(false);
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

  // Open learning skill form
  addLearningSkill(): void {
    this.showLearningForm.set(true);
  }

  // Save selected learning skill
  saveLearningSkill(): void {
    const skill = this.newLearningSkill.trim();

    if (!skill) {
      this.showNotice('Please select a skill to learn');
      return;
    }

    const alreadyExists = this.learningSkills().some(
      item => item.skillName.toLowerCase() === skill.toLowerCase()
    );

    if (alreadyExists) {
      this.showNotice('This learning skill is already added');
      return;
    }

    const userId = this.getUserId();
    if (userId === null) {
      this.showNotice('Unable to identify your account. Please sign in again.');
      return;
    }

    this.learningSkillService.addLearningSkill({
      userId,
      skillName: skill,
    }).subscribe({
      next: learningSkill => {
        this.learningSkills.update(skills => [...skills, learningSkill]);

        this.newLearningSkill = '';
        this.showLearningForm.set(false);
        this.showNotice('Learning skill added successfully');
      },
      error: error => {
        console.error('Failed to add learning skill:', error);
        this.showNotice('Failed to add learning skill. Please try again.');
      },
    });

  }

  // Remove learning skill
  removeLearningSkill(skillName: string): void {
    this.learningSkills.update(skills =>
      skills.filter(skill => skill.skillName !== skillName)
    );

    this.showNotice('Learning skill removed');
  }

  // Show notification
  private showNotice(message: string): void {
    this.notice.set(message);

    window.setTimeout(() => {
      this.notice.set('');
    }, 2800);
  }
}
