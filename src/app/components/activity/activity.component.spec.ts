import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActivityComponent } from './activity.component';

describe('ActivityComponent', () => {
  let fixture: ComponentFixture<ActivityComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('userdetails', JSON.stringify({ user: { id: 9 } }));

    await TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityComponent);
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem('userdetails');
  });

  it('shows activity from the signed-in user skills, requests, and completed sessions', () => {
    httpTestingController.expectOne('http://localhost:5218/api/Skill/user/9').flush([
      { id: 1, userId: 9, skillName: 'Python', skillType: 'expert', skillLevel: '5' },
    ]);
    httpTestingController.expectOne('http://localhost:5218/api/Request/user/9').flush([
      {
        id: 2,
        senderId: 10,
        receiverId: 9,
        senderName: 'Grace',
        receiverName: 'Ada',
        skillOffered: 'Angular',
        skillWanted: 'Python',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      },
    ]);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('You received a request from Grace for Angular');
    expect(content).toContain('You added Python to Skills I Know');
    expect(content).toContain('Session with Sara Khan for Figma completed');
    expect(content).not.toContain('Manoj');
  });
});
