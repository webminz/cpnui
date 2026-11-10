import { EditorState } from '@codemirror/state';
import { ensureSyntaxTree } from '@codemirror/language';
import { smlLanguage } from './sml-language';

function getTokens(text: string): { type: string; value: string }[] {
  const state = EditorState.create({ doc: text, extensions: [smlLanguage] });
  const tree = ensureSyntaxTree(state, text.length, 5000)!;
  const tokens: { type: string; value: string }[] = [];
  tree.iterate({
    enter(node) {
      if (node.from < node.to && node.name !== 'Document') {
        tokens.push({
          type: node.name,
          value: text.slice(node.from, node.to),
        });
      }
    },
  });
  return tokens;
}

function findToken(text: string, value: string): string | undefined {
  return getTokens(text).find((t) => t.value === value)?.type;
}

describe('SML Language', () => {
  it('should recognize val as keyword', () => {
    expect(findToken('val x = 5', 'val')).toBe('keyword');
  });

  it('should recognize colset as keyword', () => {
    expect(findToken('colset INT = int;', 'colset')).toBe('keyword');
  });

  it('should recognize int as type name', () => {
    expect(findToken('colset INT = int;', 'int')).toBe('typeName');
  });

  it('should recognize string literals', () => {
    const tokens = getTokens('"hello"');
    expect(tokens.some((t) => t.type === 'string')).toBe(true);
  });

  it('should recognize numbers', () => {
    expect(findToken('42', '42')).toBe('number');
  });

  it('should recognize boolean values', () => {
    expect(findToken('true', 'true')).toBe('bool');
    expect(findToken('false', 'false')).toBe('bool');
  });

  it('should recognize if/then/else as keywords', () => {
    expect(findToken('if x then y else z', 'if')).toBe('keyword');
    expect(findToken('if x then y else z', 'then')).toBe('keyword');
    expect(findToken('if x then y else z', 'else')).toBe('keyword');
  });

  it('should recognize operators', () => {
    expect(findToken('x + y', '+')).toBe('operator');
  });

  it('should recognize backtick as operator', () => {
    expect(findToken('1`x', '`')).toBe('operator');
  });

  it('should recognize comments', () => {
    const tokens = getTokens('(* a comment *)');
    expect(tokens.some((t) => t.type === 'comment')).toBe(true);
  });

  it('should recognize lowercase identifiers as variableName', () => {
    expect(findToken('myVar', 'myVar')).toBe('variableName');
  });

  it('should recognize uppercase identifiers as typeName', () => {
    expect(findToken('MyType', 'MyType')).toBe('typeName');
  });

  it('should recognize bool type', () => {
    expect(findToken('bool', 'bool')).toBe('typeName');
  });
});
