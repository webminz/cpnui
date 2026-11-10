import { serializeCpnXml } from './cpn-export';
import { parseCpnXml } from './cpn-import';
import { CpnNet, createDefaultNet } from '../core/model';

function minimalNet(overrides: Partial<CpnNet> = {}): CpnNet {
  return {
    id: 'net1',
    name: 'Test Net',
    colourSets: [],
    declarations: '',
    pages: [{ id: 'page1', name: 'Page 1', places: [], transitions: [], arcs: [] }],
    ...overrides,
  };
}

describe('serializeCpnXml', () => {
  it('should serialize a net with one place', () => {
    const net = minimalNet({
      pages: [
        {
          id: 'page1',
          name: 'Page 1',
          places: [
            {
              kind: 'place',
              id: 'p1',
              name: 'MyPlace',
              position: { x: 100, y: -50 },
              size: { width: 60, height: 60 },
              colourSetId: 'INT',
              initialMarking: { text: '1`1' },
            },
          ],
          transitions: [],
          arcs: [],
        },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<place id="p1">');
    expect(xml).toContain('<text>MyPlace</text>');
    expect(xml).toContain('x="100"');
    expect(xml).toContain('y="50"'); // Y negated back: -(-50) = 50
    expect(xml).toContain('<ellipse');
    expect(xml).toContain('<type id="INT">');
    expect(xml).toContain('<text>INT</text>');
    expect(xml).toContain('1`1');
  });

  it('should serialize a net with a transition', () => {
    const net = minimalNet({
      pages: [
        {
          id: 'page1',
          name: 'Page 1',
          places: [],
          transitions: [
            {
              kind: 'transition',
              id: 't1',
              name: 'MyTrans',
              position: { x: 200, y: -100 },
              size: { width: 80, height: 50 },
              guard: { text: '[x>0]' },
              duration: { text: '' },
            },
          ],
          arcs: [],
        },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<trans id="t1">');
    expect(xml).toContain('<text>MyTrans</text>');
    expect(xml).toContain('<box w="80.000000" h="50.000000"/>');
    expect(xml).toContain('[x&gt;0]'); // escaped
  });

  it('should serialize an arc with inscription', () => {
    const net = minimalNet({
      pages: [
        {
          id: 'page1',
          name: 'Page 1',
          places: [
            {
              kind: 'place',
              id: 'p1',
              name: 'P',
              position: { x: 0, y: 0 },
              size: { width: 50, height: 50 },
              colourSetId: null,
              initialMarking: { text: '' },
            },
          ],
          transitions: [
            {
              kind: 'transition',
              id: 't1',
              name: 'T',
              position: { x: 100, y: 0 },
              size: { width: 60, height: 40 },
              guard: { text: '' },
              duration: { text: '' },
            },
          ],
          arcs: [
            {
              kind: 'arc',
              id: 'a1',
              sourceId: 'p1',
              targetId: 't1',
              bendPoints: [],
              inscription: { text: 'var1' },
              arcType: 'normal',
              drawMode: 'straight',
            },
          ],
        },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<arc id="a1" orientation="PtoT">');
    expect(xml).toContain('<transend idref="t1"/>');
    expect(xml).toContain('<placeend idref="p1"/>');
    expect(xml).toContain('<text>var1</text>');
  });

  it('should serialize arc with bend points', () => {
    const net = minimalNet({
      pages: [
        {
          id: 'page1',
          name: 'Page 1',
          places: [
            {
              kind: 'place',
              id: 'p1',
              name: 'P',
              position: { x: 0, y: 0 },
              size: { width: 50, height: 50 },
              colourSetId: null,
              initialMarking: { text: '' },
            },
          ],
          transitions: [
            {
              kind: 'transition',
              id: 't1',
              name: 'T',
              position: { x: 100, y: 0 },
              size: { width: 60, height: 40 },
              guard: { text: '' },
              duration: { text: '' },
            },
          ],
          arcs: [
            {
              kind: 'arc',
              id: 'a1',
              sourceId: 'p1',
              targetId: 't1',
              bendPoints: [
                { x: 30, y: -20 },
                { x: 70, y: -20 },
              ],
              inscription: { text: '' },
              arcType: 'normal',
              drawMode: 'straight',
            },
          ],
        },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('serial="1"');
    expect(xml).toContain('serial="2"');
    expect(xml).toContain('x="30"');
    expect(xml).toContain('y="20"'); // negated back
  });

  it('should serialize colour sets in globbox', () => {
    const net = minimalNet({
      colourSets: [
        { id: 'c1', name: 'INT', declaration: 'colset INT = int;' },
        { id: 'c2', name: 'BOOL', declaration: 'colset BOOL = bool;' },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<globbox>');
    expect(xml).toContain('<id>INT</id>');
    expect(xml).toContain('colset INT = int;');
    expect(xml).toContain('<id>BOOL</id>');
  });

  it('should escape XML special characters', () => {
    const net = minimalNet({
      pages: [
        {
          id: 'page1',
          name: 'Page <1> & "test"',
          places: [
            {
              kind: 'place',
              id: 'p1',
              name: 'A & B',
              position: { x: 0, y: 0 },
              size: { width: 50, height: 50 },
              colourSetId: null,
              initialMarking: { text: '' },
            },
          ],
          transitions: [],
          arcs: [],
        },
      ],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('A &amp; B');
    expect(xml).toContain('Page &lt;1&gt; &amp; &quot;test&quot;');
  });

  it('should round-trip parse → serialize → parse', () => {
    const originalXml = `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<generator tool="CPN Tools" version="4.0.1" format="6"/>
<cpnet>
<globbox>
  <color id="c-int"><id>INT</id><int/><layout>colset INT = int;</layout></color>
</globbox>
<page id="ID6">
  <pageattr name="Petri Net"/>
  <place id="a">
    <posattr x="-228" y="-94"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <text>start</text>
    <ellipse w="60" h="40"/>
    <type id="INT"><text>INT</text></type>
    <initmark id="im"><text>[1, 5]</text></initmark>
  </place>
  <place id="c">
    <posattr x="-6" y="-57"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <text>end</text>
    <ellipse w="60" h="40"/>
    <type id="INT"><text>INT</text></type>
    <initmark id="im2"><text></text></initmark>
  </place>
  <trans id="b">
    <posattr x="-100" y="-100"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>trans</text>
    <box w="60" h="40"/>
  </trans>
  <arc id="ab" orientation="PtoT">
    <posattr x="0" y="0"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="b"/>
    <placeend idref="a"/>
    <annot id="ab_ins"><text>var1</text></annot>
  </arc>
  <arc id="bc" orientation="TtoP">
    <posattr x="0" y="0"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="b"/>
    <placeend idref="c"/>
    <annot id="bc_ins"><text>var1</text></annot>
  </arc>
</page>
</cpnet>
</workspaceElements>`;

    const net1 = parseCpnXml(originalXml);
    const serialized = serializeCpnXml(net1);
    const net2 = parseCpnXml(serialized);

    // Compare structural equivalence
    expect(net2.pages).toHaveLength(net1.pages.length);
    expect(net2.pages[0].places).toHaveLength(net1.pages[0].places.length);
    expect(net2.pages[0].transitions).toHaveLength(net1.pages[0].transitions.length);
    expect(net2.pages[0].arcs).toHaveLength(net1.pages[0].arcs.length);

    // Compare place data
    for (const p1 of net1.pages[0].places) {
      const p2 = net2.pages[0].places.find((p) => p.id === p1.id)!;
      expect(p2).toBeDefined();
      expect(p2.name).toBe(p1.name);
      expect(p2.position.x).toBeCloseTo(p1.position.x, 2);
      expect(p2.position.y).toBeCloseTo(p1.position.y, 2);
      expect(p2.colourSetId).toBe(p1.colourSetId);
      expect(p2.initialMarking.text).toBe(p1.initialMarking.text);
    }

    // Compare transition data
    for (const t1 of net1.pages[0].transitions) {
      const t2 = net2.pages[0].transitions.find((t) => t.id === t1.id)!;
      expect(t2).toBeDefined();
      expect(t2.name).toBe(t1.name);
    }

    // Compare arc data
    for (const a1 of net1.pages[0].arcs) {
      const a2 = net2.pages[0].arcs.find((a) => a.id === a1.id)!;
      expect(a2).toBeDefined();
      expect(a2.sourceId).toBe(a1.sourceId);
      expect(a2.targetId).toBe(a1.targetId);
      expect(a2.inscription.text).toBe(a1.inscription.text);
    }
  });

  it('should round-trip with bend points', () => {
    const xml = `<?xml version="1.0"?>
<workspaceElements>
<cpnet>
<globbox></globbox>
<page id="p1">
  <pageattr name="Page"/>
  <place id="p"><posattr x="0" y="0"/><text>P</text><ellipse w="40" h="40"/></place>
  <trans id="t"><posattr x="100" y="0"/><text>T</text><box w="60" h="40"/></trans>
  <arc id="a1" orientation="TtoP">
    <posattr x="0" y="0"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="t"/>
    <placeend idref="p"/>
    <annot id="ann"><text>x</text></annot>
    <bendpoint id="bp1" serial="1"><posattr x="8" y="-31"/><text></text></bendpoint>
    <bendpoint id="bp2" serial="2"><posattr x="55" y="-31"/><text></text></bendpoint>
    <bendpoint id="bp3" serial="3"><posattr x="55" y="114"/><text></text></bendpoint>
  </arc>
</page>
</cpnet>
</workspaceElements>`;

    const net1 = parseCpnXml(xml);
    const serialized = serializeCpnXml(net1);
    const net2 = parseCpnXml(serialized);

    const a1 = net1.pages[0].arcs[0];
    const a2 = net2.pages[0].arcs.find((a) => a.id === a1.id)!;
    expect(a2.bendPoints).toHaveLength(a1.bendPoints.length);
    for (let i = 0; i < a1.bendPoints.length; i++) {
      expect(a2.bendPoints[i].x).toBeCloseTo(a1.bendPoints[i].x, 1);
      expect(a2.bendPoints[i].y).toBeCloseTo(a1.bendPoints[i].y, 1);
    }
  });
});

describe('serializeCpnXml — editor extensions', () => {
  it('writes the colour set colour as a comment and reads it back', () => {
    const net = createDefaultNet();
    net.colourSets = [{ id: 'c1', name: 'INT', declaration: 'colset INT = int;', color: '#ec4899' }];
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<!-- cpn-editor:colour=#ec4899 -->');
    const back = parseCpnXml(xml);
    expect(back.colourSets[0].color).toBe('#ec4899');
  });

  it('marks shapes with an explicit fill colour as filled', () => {
    const net = createDefaultNet();
    net.pages[0].places.push({
      kind: 'place',
      id: 'p1',
      name: 'P1',
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
      colourSetId: 'INT',
      initialMarking: { text: '' },
      graphics: { fillColor: '#ffff00' },
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<fillattr colour="#ffff00" pattern="" filled="true"/>');
    const back = parseCpnXml(xml);
    expect(back.pages[0].places[0].graphics?.fillColor).toBe('#ffff00');
  });

  it('round-trips unset graphics as unset', () => {
    const net = createDefaultNet();
    net.pages[0].places.push({
      kind: 'place',
      id: 'p1',
      name: 'P1',
      position: { x: 0, y: 0 },
      size: { width: 50, height: 50 },
      colourSetId: 'INT',
      initialMarking: { text: '' },
    });
    const back = parseCpnXml(serializeCpnXml(net));
    const g = back.pages[0].places[0].graphics;
    expect(g?.strokeColor).toBeUndefined();
    expect(g?.fillColor).toBeUndefined();
    expect(g?.fontColor).toBeUndefined();
  });
});

describe('serializeCpnXml — colour set structured types (Bug 1)', () => {
  it('exports int colour set with structured XML', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'INT', declaration: 'colset INT = int;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<colorid="c1"><id>INT</id><int/>');
    expect(xml).toContain('<layout>colset INT = int;</layout>');
  });

  it('exports int with range', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'RANGE', declaration: 'colset RANGE = int with 0..10;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<int><with><ml>0</ml><ml>10</ml></with></int>');
  });

  it('exports string colour set', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'STR', declaration: 'colset STR = string;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<string/>');
  });

  it('exports product with timed', () => {
    const net = minimalNet({
      colourSets: [{
        id: 'c1',
        name: 'INTxDATA',
        declaration: 'colset INTxDATA = product INT * DATA timed;',
      }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    // Verify <timed/> appears before <product>
    expect(normalized).toContain('<timed/><product><id>INT</id><id>DATA</id></product>');
    expect(xml).toContain('<layout>colset INTxDATA = product INT * DATA timed;</layout>');
  });

  it('exports enum (with clause)', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'E', declaration: 'colset E = with a | b | c;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<enum><id>a</id><id>b</id><id>c</id></enum>');
  });

  it('exports record', () => {
    const net = minimalNet({
      colourSets: [{
        id: 'c1',
        name: 'REC',
        declaration: 'colset REC = record x:int * y:string;',
      }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain(
      '<record><recordfield><id>x</id><id>int</id></recordfield>' +
        '<recordfield><id>y</id><id>string</id></recordfield></record>'
    );
  });

  it('exports list', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'IL', declaration: 'colset IL = list INT;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<list><id>INT</id></list>');
  });

  it('exports union', () => {
    const net = minimalNet({
      colourSets: [{
        id: 'c1',
        name: 'U',
        declaration: 'colset U = union a:int + b + c:string;',
      }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain(
      '<union>' +
        '<unionfield><id>a</id><id>int</id></unionfield>' +
        '<unionfield><id>b</id></unionfield>' +
        '<unionfield><id>c</id><id>string</id></unionfield>' +
        '</union>'
    );
  });

  it('exports subset with function', () => {
    const net = minimalNet({
      colourSets: [{
        id: 'c1',
        name: 'EVEN',
        declaration: 'colset EVEN = subset int by evenFun;',
      }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<subset><id>int</id><by><ml>evenFun</ml></by></subset>');
  });

  it('exports unit type', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'U', declaration: 'colset U = ();' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<unit/>');
  });

  it('exports alias', () => {
    const net = minimalNet({
      colourSets: [{ id: 'c1', name: 'ALIAS', declaration: 'colset ALIAS = INT;' }],
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<alias><id>INT</id></alias>');
  });
});

describe('serializeCpnXml — variables (Bug 2)', () => {
  it('exports variable as <var> with type and names', () => {
    const net = minimalNet({
      declarations: 'var n : INT;',
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<varid="');
    expect(normalized).toContain('<type><id>INT</id></type>');
    expect(normalized).toContain('<id>n</id>');
    expect(xml).toContain('<layout>var n : INT;</layout>');
  });

  it('exports multiple variable names in one declaration', () => {
    const net = minimalNet({
      declarations: 'var n, k : INT;',
    });
    const xml = serializeCpnXml(net);
    const normalized = xml.replace(/\s+/g, '');
    expect(normalized).toContain('<type><id>INT</id></type>');
    expect(normalized).toContain('<id>n</id>');
    expect(normalized).toContain('<id>k</id>');
  });

  it('keeps non-variable declarations as <ml>', () => {
    const net = minimalNet({
      declarations: 'var n, k : INT;\nfun f x = x;',
    });
    const xml = serializeCpnXml(net);
    // Should have a <var> for the variable
    expect(xml).toContain('<var id=');
    // Should have an <ml> for the function
    expect(xml).toContain('<ml id=');
    expect(xml).toContain('fun f x = x;');
    // The <var> should not contain "var n"
    const varMatch = xml.match(/<var[^>]*>[\s\S]*?<\/var>/);
    if (varMatch) {
      // The <ml> blocks in globbox should not mix var content
      const mlMatches = xml.match(/<ml[^>]*>[\s\S]*?<\/ml>/g) || [];
      const hasVarInMl = mlMatches.some((ml) => ml.includes('var n'));
      expect(hasVarInMl).toBe(false);
    }
  });
});

describe('serializeCpnXml — transition delays (Bug 3)', () => {
  it('adds @+ prefix to duration without it', () => {
    const net = minimalNet({
      pages: [{
        id: 'page1',
        name: 'Page 1',
        places: [],
        transitions: [{
          kind: 'transition',
          id: 't1',
          name: 'T',
          position: { x: 100, y: 100 },
          size: { width: 60, height: 40 },
          guard: { text: '' },
          duration: { text: '5' },
        }],
        arcs: [],
      }],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<text>@+5</text>');
  });

  it('preserves @+ prefix if already present', () => {
    const net = minimalNet({
      pages: [{
        id: 'page1',
        name: 'Page 1',
        places: [],
        transitions: [{
          kind: 'transition',
          id: 't1',
          name: 'T',
          position: { x: 100, y: 100 },
          size: { width: 60, height: 40 },
          guard: { text: '' },
          duration: { text: '@+7' },
        }],
        arcs: [],
      }],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<text>@+7</text>');
    // Ensure no double @+
    expect(xml).not.toContain('@+@+');
  });

  it('prefixes function calls with @+', () => {
    const net = minimalNet({
      pages: [{
        id: 'page1',
        name: 'Page 1',
        places: [],
        transitions: [{
          kind: 'transition',
          id: 't1',
          name: 'T',
          position: { x: 100, y: 100 },
          size: { width: 60, height: 40 },
          guard: { text: '' },
          duration: { text: 'DEL()' },
        }],
        arcs: [],
      }],
    });
    const xml = serializeCpnXml(net);
    expect(xml).toContain('<text>@+DEL()</text>');
  });

  it('omits empty duration text', () => {
    const net = minimalNet({
      pages: [{
        id: 'page1',
        name: 'Page 1',
        places: [],
        transitions: [{
          kind: 'transition',
          id: 't1',
          name: 'T',
          position: { x: 100, y: 100 },
          size: { width: 60, height: 40 },
          guard: { text: '' },
          duration: { text: '' },
        }],
        arcs: [],
      }],
    });
    const xml = serializeCpnXml(net);
    expect(xml).not.toContain('<time');
  });
});

describe('serializeCpnXml — round-trip with structured types', () => {
  it('round-trips product colour set with timed', () => {
    const net = minimalNet({
      colourSets: [{
        id: 'c1',
        name: 'INTxDATA',
        declaration: 'colset INTxDATA = product INT * DATA timed;',
      }],
    });
    const xml = serializeCpnXml(net);
    const parsed = parseCpnXml(xml);
    // Declaration should be reconstructed exactly
    expect(parsed.colourSets[0].declaration).toBe('colset INTxDATA = product INT * DATA timed;');
  });

  it('reconstructs colourset from structured XML when layout is missing', () => {
    // Create XML with structured type but no layout
    const xml = `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<cpnet>
<globbox>
<color id="c1"><id>INTxDATA</id><timed/><product><id>INT</id><id>DATA</id></product></color>
</globbox>
<page id="p1"><pageattr name="Page 1"/></page>
</cpnet>
</workspaceElements>`;

    const parsed = parseCpnXml(xml);
    // Without layout, importer should reconstruct from structured XML
    expect(parsed.colourSets[0].declaration).toBe('colset INTxDATA = product INT * DATA timed;');
  });
});
