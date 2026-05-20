import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProblemCreationPage } from './problem-creation-page';

describe('ProblemCreationPage', () => {
  let component: ProblemCreationPage;
  let fixture: ComponentFixture<ProblemCreationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemCreationPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemCreationPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
