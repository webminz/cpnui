import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, viewChild } from '@angular/core';
import { CodeEditorComponent } from './code-editor.component';

@Component({
  standalone: true,
  imports: [CodeEditorComponent],
  template: `<cpn-code-editor [value]="value()" (valueChange)="onValueChange($event)" (blur)="onBlur()" />`,
})
class TestHostComponent {
  value = signal('');
  lastEmitted = '';
  blurred = false;
  editor = viewChild(CodeEditorComponent);
  onValueChange(v: string) {
    this.lastEmitted = v;
  }
  onBlur() {
    this.blurred = true;
  }
}

describe('CodeEditorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    const editor = host.editor();
    expect(editor).toBeTruthy();
  });

  it('should render with initial value', async () => {
    host.value.set('hello world');
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const cmContent = el.querySelector('.cm-content');
    expect(cmContent?.textContent).toContain('hello world');
  });

  it('should expose focus method', () => {
    const editor = host.editor();
    expect(() => editor!.focus()).not.toThrow();
  });
});
