import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentCreationModal } from './assignment-creation-modal';

describe('AssignmentCreationModal', () => {
  let component: AssignmentCreationModal;
  let fixture: ComponentFixture<AssignmentCreationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentCreationModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignmentCreationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
