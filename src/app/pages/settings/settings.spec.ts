import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SettingsComponent } from './settings';
import { authInterceptor } from '../../shared/auth/auth.interceptor';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.setItem('userdetails', JSON.stringify({
      token: 'settings-token',
      user: { id: 9 },
    }));
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('shows account information from saved user details', () => {
    localStorage.setItem('userdetails', JSON.stringify({
      token: 'settings-token',
      user: {
        id: 9,
        fullName: 'Manoj Kumar',
        username: 'manoj',
        email: 'manoj@example.com',
        mobileNumber: '1234567890',
      },
    }));
    fixture.destroy();
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.fullName).toBe('Manoj Kumar');
    expect(component.username).toBe('manoj');
    expect(component.email).toBe('manoj@example.com');
    expect(component.mobileNumber).toBe('1234567890');
    expect(fixture.nativeElement.textContent).toContain('Manoj Kumar');
    expect(fixture.nativeElement.querySelector('.profile-avatar')?.textContent).toContain('M');
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.removeItem('userdetails');
  });

  it('submits current and new passwords to the change-password API', () => {
    component.currentPassword = 'old-password';
    component.newPassword = 'new-password';
    component.confirmPassword = 'new-password';

    component.changePassword();

    const request = httpTestingController.expectOne(
      'http://localhost:5218/api/User/change-password',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    expect(request.request.headers.get('Authorization')).toBe('Bearer settings-token');
    request.flush('Password changed successfully.');

    expect(component.passwordSuccess()).toBe('Your password has been updated.');
    expect(component.currentPassword).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('does not submit when the password confirmation does not match', () => {
    component.currentPassword = 'old-password';
    component.newPassword = 'new-password';
    component.confirmPassword = 'different-password';

    component.changePassword();

    httpTestingController.expectNone('http://localhost:5218/api/User/change-password');
    expect(component.passwordError()).toBe('The new password and confirmation do not match.');
  });
});
