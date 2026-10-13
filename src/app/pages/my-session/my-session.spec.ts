import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySession } from './my-session';

describe('MySession', () => {
    let component: MySession;
    let fixture: ComponentFixture<MySession>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MySession],
        }).compileComponents();

        fixture = TestBed.createComponent(MySession);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
