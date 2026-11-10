import { StreamLanguage, StringStream } from '@codemirror/language';
import { tags, Tag } from '@lezer/highlight';

const keywords = new Set([
  'abstype', 'and', 'andalso', 'as', 'case', 'datatype', 'do', 'else', 'end',
  'exception', 'fn', 'fun', 'functor', 'handle', 'if', 'in', 'infix', 'infixr',
  'let', 'local', 'nonfix', 'of', 'op', 'open', 'orelse', 'raise', 'rec',
  'sig', 'signature', 'struct', 'structure', 'then', 'type', 'val', 'where',
  'while', 'with', 'withtype',
  // CPN-specific
  'colset', 'var', 'color', 'timed', 'declare', 'use', 'globref', 'input', 'output',
]);

const typeNames = new Set([
  'unit', 'bool', 'int', 'intinf', 'time', 'real', 'string', 'char', 'word',
  'order', 'list', 'option', 'ref', 'exn',
  // CPN built-in colour set types
  'UNIT', 'BOOL', 'INT', 'INTINF', 'TIME', 'REAL', 'STRING',
]);

const constructors = new Set([
  'enum', 'product', 'record', 'union', 'subset', 'alias', 'index',
  'with', 'by', 'and', 'declare', 'timed',
]);

const builtinValues = new Set([
  'true', 'false', 'nil', 'NONE', 'SOME', 'LESS', 'GREATER', 'EQUAL',
]);

interface SmlState {
  commentDepth: number;
  inString: boolean;
}

function tokenBase(stream: StringStream, state: SmlState): string | null {
  // Whitespace
  if (stream.eatSpace()) return null;

  const ch = stream.peek()!;

  // Nested comments (* ... *)
  if (ch === '(' && stream.match('(*', false)) {
    stream.next();
    stream.next();
    state.commentDepth++;
    return tokenComment(stream, state);
  }

  // Strings
  if (ch === '"') {
    stream.next();
    state.inString = true;
    return tokenString(stream, state);
  }

  // Character literal
  if (ch === '#' && stream.match(/^#"/, false)) {
    stream.next();
    stream.next();
    // read one char (possibly escaped)
    if (stream.peek() === '\\') {
      stream.next();
      stream.next();
    } else {
      stream.next();
    }
    if (stream.peek() === '"') stream.next();
    return 'string';
  }

  // Numbers: SML uses ~ for negative
  if (ch === '~' || (ch >= '0' && ch <= '9')) {
    if (ch === '~') {
      const next = stream.string.charAt(stream.pos + 1);
      if (next >= '0' && next <= '9') {
        stream.next(); // consume ~
      } else {
        // ~ as an operator
        stream.next();
        return 'operator';
      }
    }
    if (stream.match(/^0x[0-9a-fA-F]+/) || stream.match(/^0w[0-9]+/) || stream.match(/^[0-9]+(\.[0-9]+)?([eE]~?[0-9]+)?/)) {
      return 'number';
    }
    // If we consumed ~ but then failed to read a number, treat as operator
    return 'operator';
  }

  // Backtick — CPN multiset notation
  if (ch === '`') {
    stream.next();
    return 'operator';
  }

  // Operators
  if ('=<>!+-*/^@#|&%'.includes(ch)) {
    stream.match(/^[=<>!+\-*/^@#|&%]+/);
    return 'operator';
  }

  // Arrows and other symbols
  if (ch === ':') {
    stream.next();
    if (stream.eat(':')) return 'operator'; // ::
    return 'operator';
  }

  if (ch === ';' || ch === ',') {
    stream.next();
    return 'punctuation';
  }

  if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '{' || ch === '}') {
    stream.next();
    return 'bracket';
  }

  if (ch === '_') {
    stream.next();
    if (!stream.match(/^[a-zA-Z0-9_']*/)) {
      // lone wildcard
    }
    return 'variableName';
  }

  if (ch === '.') {
    stream.next();
    return 'operator';
  }

  // Words
  if (/[a-zA-Z]/.test(ch)) {
    stream.match(/^[a-zA-Z0-9_']*/);
    const word = stream.current();
    if (keywords.has(word)) return 'keyword';
    if (typeNames.has(word)) return 'typeName';
    if (builtinValues.has(word)) return 'bool';
    // Check if it looks like a type constructor (starts with uppercase after module prefix)
    if (constructors.has(word)) return 'keyword';
    if (word.charAt(0) >= 'A' && word.charAt(0) <= 'Z') return 'typeName';
    return 'variableName';
  }

  // Catch-all
  stream.next();
  return null;
}

function tokenComment(stream: StringStream, state: SmlState): string {
  while (!stream.eol()) {
    if (stream.match('*)')) {
      state.commentDepth--;
      if (state.commentDepth <= 0) {
        state.commentDepth = 0;
        return 'comment';
      }
    } else if (stream.match('(*')) {
      state.commentDepth++;
    } else {
      stream.next();
    }
  }
  return 'comment';
}

function tokenString(stream: StringStream, state: SmlState): string {
  while (!stream.eol()) {
    const ch = stream.next()!;
    if (ch === '\\') {
      stream.next(); // skip escaped char
    } else if (ch === '"') {
      state.inString = false;
      return 'string';
    }
  }
  // unterminated string (SML doesn't allow multiline strings, but be lenient)
  state.inString = false;
  return 'string';
}

// Map our token names to CodeMirror/lezer tags
const tagMap: Record<string, Tag> = {
  keyword: tags.keyword,
  typeName: tags.typeName,
  string: tags.string,
  number: tags.number,
  comment: tags.comment,
  operator: tags.operator,
  variableName: tags.variableName,
  bool: tags.bool,
  bracket: tags.bracket,
  punctuation: tags.punctuation,
};

export const smlLanguage = StreamLanguage.define<SmlState>({
  name: 'sml',
  startState(): SmlState {
    return { commentDepth: 0, inString: false };
  },
  token(stream: StringStream, state: SmlState): string | null {
    if (state.commentDepth > 0) {
      return tokenComment(stream, state);
    }
    if (state.inString) {
      return tokenString(stream, state);
    }
    return tokenBase(stream, state);
  },
  languageData: {
    commentTokens: { block: { open: '(*', close: '*)' } },
  },
  tokenTable: tagMap,
});
