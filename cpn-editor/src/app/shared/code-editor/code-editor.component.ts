import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { lineNumbers } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';
import { CanvasStoreService } from '../../state/canvas-store.service';
import { lightTheme, darkTheme } from './cm-themes';
import { CompletionProvider, smlCompletionSource } from './sml-completion';

@Component({
  selector: 'cpn-code-editor',
  standalone: true,
  template: `<div #editorHost class="cm-host"></div>`,
  styles: `
    :host {
      display: block;
    }
    .cm-host {
      border: 1px solid var(--cpn-border-subtle);
      border-radius: 4px;
      overflow: hidden;
    }
    .cm-host:focus-within {
      border-color: var(--cpn-active);
    }
    :host ::ng-deep .cm-editor {
      outline: none;
    }
    :host ::ng-deep .cm-scroller {
      overflow: auto;
    }
  `,
})
export class CodeEditorComponent implements OnDestroy {
  private readonly canvasStore = inject(CanvasStoreService);
  private readonly editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');

  readonly value = input('');
  readonly showLineNumbers = input(false);
  readonly minHeight = input('36px');
  readonly placeholder = input('');
  readonly extensions = input<Extension[]>([]);
  readonly completionProvider = input<CompletionProvider | undefined>(undefined);
  readonly trapTab = input(true);

  readonly valueChange = output<string>();
  readonly blur = output<void>();

  private view: EditorView | null = null;
  private readonly themeCompartment = new Compartment();
  private readonly langCompartment = new Compartment();
  private suppressNextUpdate = false;

  constructor() {
    effect(() => {
      const host = this.editorHost();
      if (host && !this.view) {
        this.createEditor(host.nativeElement);
      }
    });

    effect(() => {
      const dark = this.canvasStore.darkMode();
      if (this.view) {
        this.view.dispatch({
          effects: this.themeCompartment.reconfigure(dark ? darkTheme : lightTheme),
        });
      }
    });

    effect(() => {
      const val = this.value();
      if (this.view && this.view.state.doc.toString() !== val) {
        this.suppressNextUpdate = true;
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: val },
        });
        this.suppressNextUpdate = false;
      }
    });

    effect(() => {
      const exts = this.extensions();
      if (this.view) {
        this.view.dispatch({
          effects: this.langCompartment.reconfigure(exts),
        });
      }
    });
  }

  focus(): void {
    this.view?.focus();
  }

  ngOnDestroy(): void {
    this.view?.destroy();
    this.view = null;
  }

  private createEditor(parent: HTMLElement): void {
    const dark = this.canvasStore.darkMode();
    const keymaps = this.trapTab()
      ? [...defaultKeymap, ...historyKeymap]
      : [...defaultKeymap.filter((k) => k.key !== 'Tab' && k.key !== 'Shift-Tab'), ...historyKeymap];
    const exts: Extension[] = [
      this.themeCompartment.of(dark ? darkTheme : lightTheme),
      this.langCompartment.of(this.extensions()),
      history(),
      keymap.of(keymaps),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !this.suppressNextUpdate) {
          this.valueChange.emit(update.state.doc.toString());
        }
        if (update.focusChanged && !update.view.hasFocus) {
          this.blur.emit();
        }
      }),
      EditorView.contentAttributes.of({
        style: `min-height: ${this.minHeight()}`,
      }),
    ];

    if (this.showLineNumbers()) {
      exts.push(lineNumbers());
    }

    const provider = this.completionProvider();
    exts.push(
      autocompletion({
        override: [smlCompletionSource(provider)],
        activateOnTyping: true,
      })
    );

    const ph = this.placeholder();
    if (ph) {
      exts.push(cmPlaceholder(ph));
    }

    const state = EditorState.create({
      doc: this.value(),
      extensions: exts,
    });

    this.view = new EditorView({ state, parent });
  }
}
