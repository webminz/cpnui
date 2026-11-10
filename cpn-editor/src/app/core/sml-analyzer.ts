import { ColourSet } from './model/cpn-net';

/** Resolved base type of a colour set */
export type BaseType =
  | 'int'
  | 'real'
  | 'string'
  | 'bool'
  | 'unit'
  | 'enum'
  | 'product'
  | 'record'
  | 'list'
  | 'union'
  | 'subset'
  | 'alias'
  | 'index'
  | 'unknown';

export interface ResolvedColourSet {
  name: string;
  baseType: BaseType;
  /** For product types: component colour set names */
  components?: string[];
  /** For list types: element colour set name */
  elementType?: string;
  /** For alias: the referenced colour set name */
  aliasOf?: string;
  /** True when the declaration carries the trailing `timed` modifier */
  timed?: boolean;
}

export interface DeclaredVariable {
  name: string;
  colourSetName: string;
}

/**
 * Parse a colour set declaration to extract its base type.
 * Handles forms like:
 *   colset INT = int;
 *   colset PAIR = product INT * STRING;
 *   colset INTLIST = list INT;
 *   colset COLOR = with red | green | blue;
 *   colset MYINT = INT;
 *   colset TINT = int timed;
 *   colset Ten0 = int with 0..10;
 *
 * A trailing `timed` modifier applies to the whole colour set (not to the last
 * product component) and is reported via `timed`. In CPN Tools a timed product
 * may have untimed components, so `timed` never affects component names.
 */
export function resolveColourSet(cs: ColourSet, allSets: ColourSet[]): ResolvedColourSet {
  const decl = cs.declaration.trim().replace(/;$/, '').trim();
  const m = decl.match(/^\s*colset\s+(\w+)\s*=\s*(.*)/s);
  if (!m) return { name: cs.name, baseType: 'unknown' };

  let body = m[2].trim();
  const timedMatch = body.match(/^(.*?)\s+timed$/s);
  const timed = timedMatch !== null;
  if (timedMatch) body = timedMatch[1].trim();

  const resolved = resolveBody(cs.name, body, allSets);
  return timed ? { ...resolved, timed: true } : resolved;
}

function resolveBody(name: string, body: string, allSets: ColourSet[]): ResolvedColourSet {
  // Primitive types (case-sensitive: SML uses lowercase int, string, etc.),
  // optionally restricted with "with lo..hi" / "with lo hi".
  if (/^int(\s+with\b.*)?$/s.test(body)) return { name, baseType: 'int' };
  if (/^real(\s+with\b.*)?$/s.test(body)) return { name, baseType: 'real' };
  if (/^string(\s+with\b.*)?$/s.test(body)) return { name, baseType: 'string' };
  if (/^bool(\s+with\b.*)?$/s.test(body)) return { name, baseType: 'bool' };
  if (/^\(\)$/.test(body) || /^unit(\s+with\b.*)?$/s.test(body)) return { name, baseType: 'unit' };

  // Enum: "with red | green | blue"
  if (/^with\s+/.test(body)) return { name, baseType: 'enum' };

  // Product: "product CS1 * CS2 * ..."
  const productMatch = body.match(/^product\s+(.*)/i);
  if (productMatch) {
    const components = productMatch[1].split('*').map((s) => s.trim());
    return { name, baseType: 'product', components };
  }

  // Record: "record field1:CS1 * field2:CS2"
  if (/^record\s+/i.test(body)) return { name, baseType: 'record' };

  // List: "list CS"
  const listMatch = body.match(/^list\s+(\w+)/i);
  if (listMatch) return { name, baseType: 'list', elementType: listMatch[1] };

  // Union: "union CS1 + CS2" or "union CS1 | CS2"
  if (/^union\s+/i.test(body)) return { name, baseType: 'union' };

  // Subset: "subset CS with/by ..."
  if (/^subset\s+/i.test(body)) return { name, baseType: 'subset' };

  // Index: "index CS with ..."
  if (/^index\s+/i.test(body)) return { name, baseType: 'index' };

  // Alias: plain name referencing another colour set
  const aliasName = body.match(/^(\w+)$/);
  if (aliasName) {
    const referenced = allSets.find((s) => s.name === aliasName[1]);
    if (referenced) return { name, baseType: 'alias', aliasOf: aliasName[1] };
  }

  return { name, baseType: 'unknown' };
}

/**
 * Parse variable declarations from the global declarations text.
 * Handles forms like:
 *   var x : INT;
 *   var x, y : INT;
 *   var x : INT; var y : STRING;
 */
export function parseVariableDeclarations(text: string): DeclaredVariable[] {
  const vars: DeclaredVariable[] = [];
  // Match "var name1, name2 : TYPE"
  const re = /\bvar\s+([\w\s,]+?)\s*:\s*(\w+)\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const names = match[1].split(',').map((n) => n.trim()).filter(Boolean);
    const csName = match[2];
    for (const name of names) {
      vars.push({ name, colourSetName: csName });
    }
  }
  return vars;
}

/**
 * Parse function declarations from the global declarations text.
 * Returns function names (not full type info).
 * Handles: fun name ... = ... and val name = ...
 */
export function parseFunctionNames(text: string): string[] {
  const names: string[] = [];
  const funRe = /\bfun\s+(\w+)/g;
  const valRe = /\bval\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = funRe.exec(text)) !== null) names.push(m[1]);
  while ((m = valRe.exec(text)) !== null) names.push(m[1]);
  return names;
}

/** SML keywords and built-in names that should not be treated as undefined references */
const SML_KEYWORDS = new Set([
  'if', 'then', 'else', 'case', 'of', 'let', 'in', 'end', 'fn', 'fun', 'val',
  'true', 'false', 'nil', 'NONE', 'SOME', 'not', 'andalso', 'orelse',
  'hd', 'tl', 'rev', 'length', 'map', 'foldl', 'foldr', 'filter',
  'Int', 'Real', 'String', 'Bool', 'List', 'Option',
  'empty', 'input', 'output',
]);

/** SML operators that appear as symbols */
const SML_OPERATOR_RE = /^[+\-*\/~<>=!@#$%^&|`:]+$/;

/**
 * Extract identifier references from an SML expression.
 * Returns names that look like variable/function references (not keywords, not literals).
 */
export function extractIdentifiers(text: string): string[] {
  if (!text.trim()) return [];
  // Remove string literals
  let cleaned = text.replace(/"(?:[^"\\]|\\.)*"/g, '');
  // Remove comments
  cleaned = cleaned.replace(/\(\*[\s\S]*?\*\)/g, '');
  // Remove numeric literals (including multiset coefficient notation)
  cleaned = cleaned.replace(/\b\d+(`)?/g, '');
  // Extract word tokens
  const tokens = cleaned.match(/\b[a-zA-Z_][a-zA-Z0-9_']*\b/g) ?? [];
  // Filter out keywords and type names
  return [...new Set(tokens)].filter(
    (t) => !SML_KEYWORDS.has(t) && !SML_OPERATOR_RE.test(t)
  );
}

/**
 * Check whether an expression is a simple variable reference (single identifier).
 */
export function isSimpleVariable(text: string): boolean {
  return /^\s*[a-zA-Z_][a-zA-Z0-9_']*\s*$/.test(text);
}

/**
 * Check whether an expression is a destructuring pattern like (x, y).
 */
export function isDestructuringPattern(text: string): boolean {
  return /^\s*\([\w\s,'+]+\)\s*$/.test(text);
}

/**
 * Extract component names from a destructuring pattern "(x, y, z)".
 */
export function extractDestructuredNames(text: string): string[] {
  const inner = text.replace(/[()]/g, '');
  return inner.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse a multiset expression token count.
 * Handles:  "1`x", "2`(a,b)++1`(c,d)", "x" (shorthand for 1`x), "3", empty
 */
export function parseMultisetTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Plain integer — shorthand for 1 token with that value
  if (/^\d+$/.test(trimmed)) return 1;

  // Split on ++ (multiset union)
  const parts = trimmed.split('++');
  let total = 0;
  let anyCoefficient = false;

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)`/);
    if (m) {
      total += parseInt(m[1], 10);
      anyCoefficient = true;
    } else {
      // No coefficient — shorthand for 1`value
      total += 1;
      anyCoefficient = true;
    }
  }

  return anyCoefficient ? total : 0;
}
