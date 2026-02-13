import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  template: ` <div #editorContainer class="h-full w-full rounded-xl overflow-hidden"></div> `,
})
export class MonacoEditorComponent implements AfterViewInit {
  @ViewChild('editorContainer', { static: true })
  editorContainer!: ElementRef;

  @Input() language: string = 'markdown';
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private platformId = inject(PLATFORM_ID);
  private editor: any;

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const monaco = await import('monaco-editor');

    (window as any).MonacoEnvironment = {
      getWorkerUrl: () => '/assets/monaco/vs/base/worker/workerMain.js',
    };

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.value,
      language: this.language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      scrollBeyondLastLine: false,
    });

    this.editor.onDidChangeModelContent(() => {
      const newValue = this.editor.getValue();
      this.valueChange.emit(newValue);
    });
  }
}
