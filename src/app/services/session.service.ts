import { Injectable, signal } from '@angular/core';

export type SessionStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export type Session = {
  id: number;
  skill: string;
  partner: string;
  avatar: string;
  date: string;
  time: string;
  duration: string;
  status: SessionStatus;
  mode: string;
};

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  readonly sessions = signal<Session[]>([
    { id: 1, skill: 'UI/UX Design', partner: 'Priya Nair', avatar: 'P', date: 'Sep 6, 2026', time: '10:00 AM', duration: '1 hour', status: 'Upcoming', mode: 'Online' },
    { id: 2, skill: 'Python Basics', partner: 'Vikram Roy', avatar: 'V', date: 'Sep 8, 2026', time: '4:00 PM', duration: '1.5 hours', status: 'Upcoming', mode: 'In-person' },
    { id: 3, skill: 'Angular', partner: 'Aarav Sharma', avatar: 'A', date: 'Sep 10, 2026', time: '2:00 PM', duration: '2 hours', status: 'Upcoming', mode: 'Online' },
    { id: 4, skill: 'Figma', partner: 'Sara Khan', avatar: 'S', date: 'Aug 28, 2026', time: '11:00 AM', duration: '1 hour', status: 'Completed', mode: 'Online' },
    { id: 5, skill: 'JavaScript', partner: 'Rohan Das', avatar: 'R', date: 'Aug 20, 2026', time: '3:00 PM', duration: '1.5 hours', status: 'Completed', mode: 'In-person' },
    { id: 6, skill: 'CSS', partner: 'Neha Gupta', avatar: 'N', date: 'Aug 15, 2026', time: '5:00 PM', duration: '1 hour', status: 'Completed', mode: 'Online' },
    { id: 7, skill: 'Photography', partner: 'Sneha R', avatar: 'S', date: 'Aug 12, 2026', time: '9:00 AM', duration: '2 hours', status: 'Cancelled', mode: 'In-person' },
  ]);
}
