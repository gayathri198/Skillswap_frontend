import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProfileComponent } from './profile';

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
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
});
