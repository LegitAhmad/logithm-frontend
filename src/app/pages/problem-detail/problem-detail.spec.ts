import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMarkdown } from 'ngx-markdown';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

import { ProblemDetail } from './problem-detail';

describe('ProblemDetail', () => {
  let component: ProblemDetail;
  let fixture: ComponentFixture<ProblemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMarkdown(),
        provideMonacoEditor({}),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
