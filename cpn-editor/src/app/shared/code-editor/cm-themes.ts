import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const baseTheme = EditorView.baseTheme({
  '&': {
    fontSize: '12px',
    fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
  },
  '.cm-content': {
    padding: '4px 0',
    caretColor: 'var(--cpn-text)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--cpn-text)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--cpn-active)',
    opacity: '0.2',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--cpn-bg-surface-alt)',
    color: 'var(--cpn-text-muted)',
    border: 'none',
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--cpn-text)',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--cpn-bg-surface)',
    border: '1px solid var(--cpn-border)',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li': {
      padding: '2px 8px',
      fontSize: '12px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'var(--cpn-active)',
      color: 'white',
    },
  },
});

const lightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: tags.typeName, color: '#0369a1' },
  { tag: tags.string, color: '#b91c1c' },
  { tag: tags.number, color: '#c2410c' },
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.operator, color: '#374151' },
  { tag: tags.variableName, color: '#1a1a1a' },
  { tag: tags.function(tags.variableName), color: '#2563eb' },
  { tag: tags.bool, color: '#c2410c' },
  { tag: tags.definition(tags.variableName), color: '#0e7490' },
]);

// Catppuccin Mocha palette
const darkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#cba6f7' },       // mauve
  { tag: tags.typeName, color: '#89b4fa' },       // blue
  { tag: tags.string, color: '#a6e3a1' },         // green
  { tag: tags.number, color: '#fab387' },          // peach
  { tag: tags.comment, color: '#6c7086', fontStyle: 'italic' }, // overlay0
  { tag: tags.operator, color: '#89dceb' },        // sky
  { tag: tags.variableName, color: '#cdd6f4' },   // text
  { tag: tags.function(tags.variableName), color: '#89b4fa' }, // blue
  { tag: tags.bool, color: '#fab387' },            // peach
  { tag: tags.definition(tags.variableName), color: '#94e2d5' }, // teal
]);

export const lightTheme = [baseTheme, syntaxHighlighting(lightHighlight)];
export const darkTheme = [baseTheme, syntaxHighlighting(darkHighlight)];
