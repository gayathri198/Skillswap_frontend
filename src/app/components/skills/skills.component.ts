import { Component } from '@angular/core';

@Component({
  selector: 'app-skills',
  standalone: true,
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
})
export class SkillsComponent {
  skills = [
    { name: 'UI/UX Design', learners: '230', symbol: 'F', theme: 'figma' },
    { name: 'Angular', learners: '180', symbol: 'A', theme: 'angular' },
    { name: 'Python', learners: '160', symbol: 'Py', theme: 'python' },
    { name: 'Photography', learners: '120', symbol: '◉', theme: 'photo' },
  ];
}
