import { Component } from '@angular/core';

@Component({
  selector: 'app-recommended',
  standalone: true,
  templateUrl: './recommended.component.html',
  styleUrl: './recommended.component.css',
})
export class RecommendedComponent {
  people = [
    { name: 'Manoj Kumar', skill: 'Angular Expert', rating: '4.7 (18)', initial: 'M', avatar: 'avatar-manoj' },
    { name: 'Priya Sharma', skill: 'UI/UX Designer', rating: '4.8 (24)', initial: 'P', avatar: 'avatar-priya' },
    { name: 'Vikram R', skill: 'Python Expert', rating: '4.6 (15)', initial: 'V', avatar: 'avatar-vikram' },
  ];
}
