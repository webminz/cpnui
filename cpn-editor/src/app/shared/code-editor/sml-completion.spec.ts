import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { smlCompletionSource } from './sml-completion';

function getCompletions(text: string, pos?: number, provider?: () => any[]) {
  const state = EditorState.create({ doc: text });
  const ctx = new CompletionContext(state, pos ?? text.length, false);
  const source = smlCompletionSource(provider);
  return source(ctx);
}

describe('smlCompletionSource', () => {
  it('should return keyword completions for a partial word', () => {
    const result = getCompletions('va');
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('val');
    expect(labels).toContain('var');
  });

  it('should return type completions', () => {
    const result = getCompletions('in');
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('int');
    expect(labels).toContain('intinf');
  });

  it('should return null for empty non-explicit context', () => {
    const result = getCompletions(' ');
    expect(result).toBeNull();
  });

  it('should include context-aware completions from provider', () => {
    const provider = () => [{ label: 'MyColourSet', type: 'type' }];
    const result = getCompletions('My', undefined, provider);
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('MyColourSet');
  });

  it('should include CPN-specific keywords', () => {
    const result = getCompletions('col');
    expect(result).not.toBeNull();
    const labels = result!.options.map((o) => o.label);
    expect(labels).toContain('colset');
    expect(labels).toContain('color');
  });
});
