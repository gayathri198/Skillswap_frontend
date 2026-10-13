import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProfileComponent } from './profile';
import { authInterceptor } from '../../shared/auth/auth.interceptor';

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;
    let httpTestingController: HttpTestingController;

    beforeEach(async () => {
        localStorage.setItem('userdetails', JSON.stringify({
            user: {
                id: 9,
                fullName: 'Ada Lovelace',
                username: 'ada',
                email: 'ada@example.com',
                mobileNumber: '1234567890',
                role: 'Learner',
            },
        }));

        await TestBed.configureTestingModule({
            imports: [ProfileComponent],
            providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        httpTestingController = TestBed.inject(HttpTestingController);
        httpTestingController.expectOne('http://localhost:5218/api/Skill/user/9').flush([]);
        httpTestingController.expectOne('http://localhost:5218/api/Request/user/9').flush([]);
        await fixture.whenStable();
        fixture.detectChanges();
    });

    afterEach(() => {
        httpTestingController.verify();
        localStorage.removeItem('userdetails');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('displays profile details from the stored login API response', () => {
        const content = fixture.nativeElement.textContent as string;

        expect(content).toContain('Ada Lovelace');
        expect(content).toContain('ada@example.com');
        expect((fixture.nativeElement.querySelector('#phone') as HTMLInputElement).value).toBe('1234567890');
    });

    it('updates account details and refreshes saved user data', () => {
        component.toggleEdit();
        component.fullName = 'Ada Byron';
        component.username = 'ada-byron';
        component.email = 'ada.byron@example.com';
        component.phone = '5551234567';
        component.saveProfile();

        const request = httpTestingController.expectOne('http://localhost:5218/api/User/9');
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({
            fullName: 'Ada Byron',
            username: 'ada-byron',
            email: 'ada.byron@example.com',
            mobileNumber: '5551234567',
        });
        request.flush('User updated successfully.');

        expect(component.profile()?.fullName).toBe('Ada Byron');
        expect(component.profile()?.email).toBe('ada.byron@example.com');
        expect(component.isEditing()).toBe(false);

        const stored = JSON.parse(localStorage.getItem('userdetails') || '{}');
        expect(stored.user.fullName).toBe('Ada Byron');
        expect(stored.user.username).toBe('ada-byron');
    });
});
