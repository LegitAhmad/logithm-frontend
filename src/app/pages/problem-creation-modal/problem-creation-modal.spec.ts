import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProblemCreationModal } from './problem-creation-modal';

describe('ProblemCreationModal', () => {
  let component: ProblemCreationModal;
  let fixture: ComponentFixture<ProblemCreationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemCreationModal],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemCreationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
