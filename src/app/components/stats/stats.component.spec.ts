import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StatsComponent } from './stats.component';

describe('StatsComponent', () => {
  let fixture: ComponentFixture<StatsComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('userdetails', JSON.stringify({ user: { userId: 9 } }));

    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem('userdetails');
  });

  it('shows the count of skills the user knows', () => {
    const request = httpTestingController.expectOne('http://localhost:5218/api/Skill/user/9');
    request.flush([
      { id: 1, userId: 9, skillName: 'Python', skillType: 'expert', skillLevel: '5' },
      { id: 2, userId: 9, skillName: 'React', skillType: 'beginner', skillLevel: '1' },
    ]);
    httpTestingController.expectOne('http://localhost:5218/api/Request/user/9').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2');
  });

  it('shows sent and received requests for the signed-in user separately', () => {
    httpTestingController.expectOne('http://localhost:5218/api/Skill/user/9').flush([]);
    const request = httpTestingController.expectOne('http://localhost:5218/api/Request/user/9');
    request.flush([
      { id: 1, senderId: 9, receiverId: 10, senderName: 'Ada', receiverName: 'Grace', skillOffered: 'Python', skillWanted: 'React', status: 'Pending', createdAt: '' },
      { id: 2, senderId: 10, receiverId: 9, senderName: 'Grace', receiverName: 'Ada', skillOffered: 'React', skillWanted: 'Python', status: 'Accepted', createdAt: '' },
      { id: 3, senderId: '9', receiverId: 11, senderName: 'Ada', receiverName: 'Linus', skillOffered: 'Python', skillWanted: 'Linux', status: 'Declined', createdAt: '' },
    ]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards[1].textContent).toContain('2');
    expect(cards[2].textContent).toContain('1');
  });

  it('shows the completed session count from the shared sessions list', () => {
    httpTestingController.expectOne('http://localhost:5218/api/Skill/user/9').flush([]);
    httpTestingController.expectOne('http://localhost:5218/api/Request/user/9').flush([]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards[3].textContent).toContain('3');
  });
});
