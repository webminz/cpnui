import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

export type CompletionProvider = () => Completion[];

const smlKeywords: Completion[] = [
  'val', 'fun', 'fn', 'let', 'in', 'end', 'if', 'then', 'else',
  'case', 'of', 'andalso', 'orelse', 'handle', 'raise', 'exception',
  'datatype', 'type', 'structure', 'signature', 'functor',
  'open', 'local', 'rec', 'and', 'as', 'op', 'while', 'do',
  'colset', 'var', 'color', 'timed', 'declare', 'use', 'globref',
  'input', 'output',
].map((kw) => ({ label: kw, type: 'keyword' }));

const smlTypes: Completion[] = [
  'unit', 'bool', 'int', 'intinf', 'time', 'real', 'string', 'char', 'word',
  'list', 'option', 'ref',
  'UNIT', 'BOOL', 'INT', 'INTINF', 'TIME', 'REAL', 'STRING',
].map((t) => ({ label: t, type: 'type' }));

const smlConstructors: Completion[] = [
  'enum', 'product', 'record', 'union', 'subset', 'alias', 'index',
  'with', 'by',
].map((c) => ({ label: c, type: 'keyword', boost: -1 }));

const smlValues: Completion[] = [
  'true', 'false', 'nil', 'NONE', 'SOME',
].map((v) => ({ label: v, type: 'constant' }));

const builtinCompletions = [...smlKeywords, ...smlTypes, ...smlConstructors, ...smlValues];

export function smlCompletionSource(
  contextProvider?: CompletionProvider
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z_][a-zA-Z0-9_']*/);
    if (!word && !context.explicit) return null;

    const completions = [...builtinCompletions];
    if (contextProvider) {
      completions.push(...contextProvider());
    }

    return {
      from: word ? word.from : context.pos,
      options: completions,
      validFor: /^[a-zA-Z_][a-zA-Z0-9_']*$/,
    };
  };
}
