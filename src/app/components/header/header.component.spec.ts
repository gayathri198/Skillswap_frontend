import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('userdetails');
  });

  it('shows the signed-in name from the nested user details', () => {
    localStorage.setItem('userdetails', JSON.stringify({
      user: {
        fullName: 'Manoj Kumar',
        username: 'manoj',
        role: 'Learner',
      },
    }));

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.username).toBe('manoj');
    expect(fixture.nativeElement.textContent).toContain('Hello, manoj!');
    expect(fixture.nativeElement.textContent).toContain('Manoj Kumar');
    expect(fixture.nativeElement.textContent).toContain('Learner');
  });

  it('uses the full name when a username is unavailable', () => {
    localStorage.setItem('userdetails', JSON.stringify({ fullName: 'Priya Nair' }));

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.username).toBe('Priya Nair');
    expect(fixture.nativeElement.textContent).toContain('Hello, Priya Nair!');
  });
});
