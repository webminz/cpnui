import { ColourSet } from './model/cpn-net';
import {
  resolveColourSet,
  parseVariableDeclarations,
  parseFunctionNames,
  extractIdentifiers,
  isSimpleVariable,
  isDestructuringPattern,
  extractDestructuredNames,
  parseMultisetTokenCount,
} from './sml-analyzer';

describe('resolveColourSet', () => {
  const allSets: ColourSet[] = [
    { id: '1', name: 'INT', declaration: 'colset INT = int;' },
    { id: '2', name: 'STRING', declaration: 'colset STRING = string;' },
    { id: '3', name: 'BOOL', declaration: 'colset BOOL = bool;' },
    { id: '4', name: 'UNIT', declaration: 'colset UNIT = ();' },
    { id: '5', name: 'REAL', declaration: 'colset REAL = real;' },
    { id: '6', name: 'PAIR', declaration: 'colset PAIR = product INT * STRING;' },
    { id: '7', name: 'COLOR', declaration: 'colset COLOR = with red | green | blue;' },
    { id: '8', name: 'INTLIST', declaration: 'colset INTLIST = list INT;' },
    { id: '9', name: 'MYINT', declaration: 'colset MYINT = INT;' },
    { id: '10', name: 'DATA', declaration: 'colset DATA = string timed;' },
    { id: '11', name: 'INTxDATA', declaration: 'colset INTxDATA = product INT * DATA timed;' },
    { id: '12', name: 'Ten0', declaration: 'colset Ten0 = int with 0..10;' },
  ];

  it('should resolve int type', () => {
    expect(resolveColourSet(allSets[0], allSets).baseType).toBe('int');
  });

  it('should resolve string type', () => {
    expect(resolveColourSet(allSets[1], allSets).baseType).toBe('string');
  });

  it('should resolve bool type', () => {
    expect(resolveColourSet(allSets[2], allSets).baseType).toBe('bool');
  });

  it('should resolve unit type from ()', () => {
    expect(resolveColourSet(allSets[3], allSets).baseType).toBe('unit');
  });

  it('should resolve real type', () => {
    expect(resolveColourSet(allSets[4], allSets).baseType).toBe('real');
  });

  it('should resolve product type with components', () => {
    const resolved = resolveColourSet(allSets[5], allSets);
    expect(resolved.baseType).toBe('product');
    expect(resolved.components).toEqual(['INT', 'STRING']);
  });

  it('should treat a trailing "timed" as a modifier of a primitive type', () => {
    const resolved = resolveColourSet(allSets[9], allSets);
    expect(resolved.baseType).toBe('string');
    expect(resolved.timed).toBe(true);
  });

  it('should not treat a trailing "timed" as part of the last product component', () => {
    const resolved = resolveColourSet(allSets[10], allSets);
    expect(resolved.baseType).toBe('product');
    expect(resolved.components).toEqual(['INT', 'DATA']);
    expect(resolved.timed).toBe(true);
  });

  it('should not report timed for untimed declarations', () => {
    expect(resolveColourSet(allSets[5], allSets).timed).toBeUndefined();
  });

  it('should resolve int with a range restriction', () => {
    expect(resolveColourSet(allSets[11], allSets).baseType).toBe('int');
  });

  it('should resolve enum type', () => {
    expect(resolveColourSet(allSets[6], allSets).baseType).toBe('enum');
  });

  it('should resolve list type with element type', () => {
    const resolved = resolveColourSet(allSets[7], allSets);
    expect(resolved.baseType).toBe('list');
    expect(resolved.elementType).toBe('INT');
  });

  it('should resolve alias type', () => {
    const resolved = resolveColourSet(allSets[8], allSets);
    expect(resolved.baseType).toBe('alias');
    expect(resolved.aliasOf).toBe('INT');
  });

  it('should return unknown for unparseable declarations', () => {
    const cs: ColourSet = { id: 'x', name: 'X', declaration: 'something weird' };
    expect(resolveColourSet(cs, allSets).baseType).toBe('unknown');
  });

  it('should handle declaration without semicolon', () => {
    const cs: ColourSet = { id: 'x', name: 'INT2', declaration: 'colset INT2 = int' };
    expect(resolveColourSet(cs, allSets).baseType).toBe('int');
  });
});

describe('parseVariableDeclarations', () => {
  it('should parse a single variable', () => {
    const vars = parseVariableDeclarations('var x : INT;');
    expect(vars).toEqual([{ name: 'x', colourSetName: 'INT' }]);
  });

  it('should parse multiple variables in one declaration', () => {
    const vars = parseVariableDeclarations('var x, y : INT;');
    expect(vars).toEqual([
      { name: 'x', colourSetName: 'INT' },
      { name: 'y', colourSetName: 'INT' },
    ]);
  });

  it('should parse multiple separate declarations', () => {
    const vars = parseVariableDeclarations('var x : INT;\nvar s : STRING;');
    expect(vars).toEqual([
      { name: 'x', colourSetName: 'INT' },
      { name: 's', colourSetName: 'STRING' },
    ]);
  });

  it('should return empty for no declarations', () => {
    expect(parseVariableDeclarations('')).toEqual([]);
  });

  it('should return empty for non-variable text', () => {
    expect(parseVariableDeclarations('fun f x = x + 1;')).toEqual([]);
  });
});

describe('parseFunctionNames', () => {
  it('should parse fun declarations', () => {
    expect(parseFunctionNames('fun double x = x * 2;')).toContain('double');
  });

  it('should parse val declarations', () => {
    expect(parseFunctionNames('val pi = 3.14159;')).toContain('pi');
  });

  it('should parse multiple declarations', () => {
    const names = parseFunctionNames('fun f x = x;\nval c = 42;');
    expect(names).toContain('f');
    expect(names).toContain('c');
  });
});

describe('extractIdentifiers', () => {
  it('should extract simple identifiers', () => {
    const ids = extractIdentifiers('x + y');
    expect(ids).toContain('x');
    expect(ids).toContain('y');
  });

  it('should not include SML keywords', () => {
    const ids = extractIdentifiers('if x then y else z');
    expect(ids).not.toContain('if');
    expect(ids).not.toContain('then');
    expect(ids).not.toContain('else');
    expect(ids).toContain('x');
    expect(ids).toContain('y');
    expect(ids).toContain('z');
  });

  it('should not include numeric literals', () => {
    const ids = extractIdentifiers('42');
    expect(ids).toEqual([]);
  });

  it('should handle multiset notation', () => {
    const ids = extractIdentifiers('1`x ++ 2`y');
    expect(ids).toContain('x');
    expect(ids).toContain('y');
  });

  it('should return empty for empty text', () => {
    expect(extractIdentifiers('')).toEqual([]);
  });

  it('should ignore string literals', () => {
    const ids = extractIdentifiers('"hello" ^ name');
    expect(ids).not.toContain('hello');
    expect(ids).toContain('name');
  });
});

describe('isSimpleVariable', () => {
  it('should match simple names', () => {
    expect(isSimpleVariable('x')).toBe(true);
    expect(isSimpleVariable('myVar')).toBe(true);
    expect(isSimpleVariable("x'")).toBe(true);
  });

  it('should not match expressions', () => {
    expect(isSimpleVariable('x + y')).toBe(false);
    expect(isSimpleVariable('(a, b)')).toBe(false);
    expect(isSimpleVariable('42')).toBe(false);
  });

  it('should handle whitespace', () => {
    expect(isSimpleVariable('  x  ')).toBe(true);
  });
});

describe('isDestructuringPattern', () => {
  it('should match tuple patterns', () => {
    expect(isDestructuringPattern('(x, y)')).toBe(true);
    expect(isDestructuringPattern('(a, b, c)')).toBe(true);
  });

  it('should not match non-patterns', () => {
    expect(isDestructuringPattern('x')).toBe(false);
    expect(isDestructuringPattern('x + y')).toBe(false);
  });
});

describe('extractDestructuredNames', () => {
  it('should extract names from tuple', () => {
    expect(extractDestructuredNames('(x, y)')).toEqual(['x', 'y']);
  });

  it('should handle three components', () => {
    expect(extractDestructuredNames('(a, b, c)')).toEqual(['a', 'b', 'c']);
  });
});

describe('parseMultisetTokenCount', () => {
  it('should return 0 for empty text', () => {
    expect(parseMultisetTokenCount('')).toBe(0);
  });

  it('should return 1 for a plain integer (shorthand for 1 token)', () => {
    expect(parseMultisetTokenCount('42')).toBe(1);
  });

  it('should parse coefficient notation', () => {
    expect(parseMultisetTokenCount('2`x')).toBe(2);
  });

  it('should sum multiset union', () => {
    expect(parseMultisetTokenCount('1`x ++ 2`y')).toBe(3);
  });

  it('should handle shorthand without coefficient', () => {
    expect(parseMultisetTokenCount('x')).toBe(1);
  });

  it('should handle mixed shorthand and coefficient', () => {
    expect(parseMultisetTokenCount('x ++ 2`y')).toBe(3);
  });

  it('should handle string-valued multiset', () => {
    expect(parseMultisetTokenCount('1`"a" ++ 1`"b" ++ 1`"c"')).toBe(3);
  });
});
