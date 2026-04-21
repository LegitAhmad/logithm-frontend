import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCreationModal } from './course-creation-modal';

describe('CourseCreationModal', () => {
  let component: CourseCreationModal;
  let fixture: ComponentFixture<CourseCreationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCreationModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCreationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
