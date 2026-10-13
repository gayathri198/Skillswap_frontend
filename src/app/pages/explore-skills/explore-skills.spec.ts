import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExploreSkillsComponent } from './explore-skills';

describe('ExploreSkillsComponent', () => {
    let component: ExploreSkillsComponent;
    let fixture: ComponentFixture<ExploreSkillsComponent>;
    let httpTestingController: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExploreSkillsComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(ExploreSkillsComponent);
        component = fixture.componentInstance;
        httpTestingController = TestBed.inject(HttpTestingController);
        await fixture.whenStable();
    });

    afterEach(() => {
        httpTestingController.verify();
        localStorage.removeItem('userdetails');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('fetches and displays users for the selected skill after starting learning', () => {
        component.openDetails(component.skills()[1]);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('.start-button').click();

        const request = httpTestingController.expectOne(
            'http://localhost:5218/api/skills/users?skillName=Angular',
        );
        expect(request.request.method).toBe('GET');
        request.flush([{
            userId: 42,
            fullName: 'Asha Kumar',
            rating: 4.8,
            totalSessions: 12,
            email: 'asha@example.com',
        }]);
        const knownSkillsRequest = httpTestingController.expectOne(
            'http://localhost:5218/api/Skill/user/42',
        );
        const learningSkillsRequest = httpTestingController.expectOne(
            'http://localhost:5218/api/LearningSkill/user/42',
        );
        expect(knownSkillsRequest.request.method).toBe('GET');
        expect(learningSkillsRequest.request.method).toBe('GET');
        knownSkillsRequest.flush([{ id: 7, userId: 42, skillName: 'TypeScript', skillType: 'Development', skillLevel: '5' }]);
        learningSkillsRequest.flush([{ learningSkillId: 9, userId: 42, skillName: 'Python', user: {} }]);
        fixture.detectChanges();

        const popup = fixture.nativeElement.querySelector('.details-modal') as HTMLElement;
        expect(popup.textContent).toContain('Asha Kumar');
        expect(popup.textContent).toContain('4.8');
        expect(popup.textContent).toContain('12');
        expect(popup.textContent).toContain('asha@example.com');
        expect(popup.textContent).toContain('Skills known');
        expect(popup.textContent).toContain('TypeScript');
        expect(popup.textContent).toContain('Wants to learn');
        expect(popup.textContent).toContain('Python');
        expect((popup.querySelector('.send-request-button') as HTMLButtonElement).disabled).toBe(true);

        component.startLearning(component.skills()[1]);
        httpTestingController.expectNone(
            'http://localhost:5218/api/skills/users?skillName=Angular',
        );
    });

    it('sends a request using the signed-in user, selected card, and selected learning skill', () => {
        localStorage.setItem('userdetails', JSON.stringify({ user: { id: 9 } }));
        component.openDetails(component.skills()[1]);
        fixture.detectChanges();
        fixture.nativeElement.querySelector('.start-button').click();

        httpTestingController.expectOne(
            'http://localhost:5218/api/skills/users?skillName=Angular',
        ).flush([{ userId: 10, fullName: 'Asha Kumar' }]);
        httpTestingController.expectOne(
            'http://localhost:5218/api/Skill/user/10',
        ).flush([]);
        httpTestingController.expectOne(
            'http://localhost:5218/api/LearningSkill/user/10',
        ).flush([{ learningSkillId: 9, userId: 10, skillName: 'React', user: {} }]);
        fixture.detectChanges();

        const popup = fixture.nativeElement.querySelector('.details-modal') as HTMLElement;
        const select = popup.querySelector('.wanted-skill-select select') as HTMLSelectElement;
        select.value = 'React';
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        const sendButton = popup.querySelector('.send-request-button') as HTMLButtonElement;
        expect(sendButton.disabled).toBe(false);
        sendButton.click();

        const request = httpTestingController.expectOne('http://localhost:5218/api/Request');
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({
            senderId: 9,
            receiverId: 10,
            skillOffered: 'React',
            skillWanted: 'Angular',
        });
        request.flush({});
        fixture.detectChanges();

        expect(popup.querySelector('.send-request-button')?.textContent).toContain('Request Sent');
        expect((popup.querySelector('.send-request-button') as HTMLButtonElement).disabled).toBe(true);
    });
});
