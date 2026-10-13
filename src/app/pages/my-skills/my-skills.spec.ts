import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MySkills } from './my-skills';

describe('MySkills', () => {
    let component: MySkills;
    let fixture: ComponentFixture<MySkills>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MySkills],
        }).compileComponents();

        fixture = TestBed.createComponent(MySkills);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
