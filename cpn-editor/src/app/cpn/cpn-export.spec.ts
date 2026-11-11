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
    expect(xml).toMatch(/<place id="ID\d+">/);
    expect(xml).toContain('<text>MyPlace</text>');
    expect(xml).toContain('x="100"');
    expect(xml).toContain('y="50"'); // Y negated back: -(-50) = 50
    expect(xml).toContain('<ellipse');
    expect(xml).toMatch(/<type id="[^"]+">/);
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
    expect(xml).toMatch(/<trans id="ID\d+">/);
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
    expect(xml).toMatch(/<arc id="ID\d+" orientation="PtoT">/);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const transId = doc.querySelector('trans')!.getAttribute('id');
    const placeId = doc.querySelector('place')!.getAttribute('id');
    expect(doc.querySelector('arc > transend')!.getAttribute('idref')).toBe(transId);
    expect(doc.querySelector('arc > placeend')!.getAttribute('idref')).toBe(placeId);
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
      const p2 = net2.pages[0].places.find((p) => p.name === p1.name)!;
      expect(p2).toBeDefined();
      expect(p2.name).toBe(p1.name);
      expect(p2.position.x).toBeCloseTo(p1.position.x, 2);
      expect(p2.position.y).toBeCloseTo(p1.position.y, 2);
      expect(p2.colourSetId).toBe(p1.colourSetId);
      expect(p2.initialMarking.text).toBe(p1.initialMarking.text);
    }

    // Compare transition data
    for (const t1 of net1.pages[0].transitions) {
      const t2 = net2.pages[0].transitions.find((t) => t.name === t1.name)!;
      expect(t2).toBeDefined();
      expect(t2.name).toBe(t1.name);
    }

    // Compare arc data
    // Model ids are remapped on export, so compare arc endpoints by element name.
    const nameOf = (net: CpnNet, id: string) =>
      [...net.pages[0].places, ...net.pages[0].transitions].find((e) => e.id === id)?.name;
    net1.pages[0].arcs.forEach((a1, i) => {
      const a2 = net2.pages[0].arcs[i];
      expect(nameOf(net2, a2.sourceId)).toBe(nameOf(net1, a1.sourceId));
      expect(nameOf(net2, a2.targetId)).toBe(nameOf(net1, a1.targetId));
      expect(a2.inscription.text).toBe(a1.inscription.text);
    });
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
    const a2 = net2.pages[0].arcs[0];
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
    expect(normalized).toMatch(/<colorid="ID\d+"><id>INT<\/id><int\/>/);
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

describe('serializeCpnXml — CPN Tools compatibility (#1)', () => {
  /** Exercises every id-bearing element: shared colour sets, all inscriptions, bend points. */
  function richNet(): CpnNet {
    return minimalNet({
      colourSets: [{ id: '2485f676-cs', name: 'Pat', declaration: 'colset Pat = int;' }],
      declarations: 'var p : Pat;\nval x = 1;',
      pages: [
        {
          id: '3348309a-page',
          name: 'Page 1',
          places: [
            {
              kind: 'place',
              id: 'ef4ecefc-wait',
              name: 'wait',
              position: { x: -400, y: -200 },
              size: { width: 40, height: 20 },
              colourSetId: 'Pat',
              initialMarking: { text: '1`1' },
            },
            {
              kind: 'place',
              id: '3097cc0f-done',
              name: 'done',
              position: { x: 0, y: -200 },
              size: { width: 40, height: 20 },
              colourSetId: 'Pat',
              initialMarking: { text: '' },
            },
          ],
          transitions: [
            {
              kind: 'transition',
              id: '9cabfc30-start',
              name: 'start',
              position: { x: -200, y: -200 },
              size: { width: 60, height: 40 },
              guard: { text: '[p > 0]' },
              duration: { text: '5' },
            },
          ],
          arcs: [
            {
              kind: 'arc',
              id: '1a2b3c4d-a1',
              sourceId: 'ef4ecefc-wait',
              targetId: '9cabfc30-start',
              bendPoints: [{ x: -300, y: -250 }],
              inscription: { text: 'p' },
              arcType: 'normal',
              drawMode: 'straight',
            },
            {
              kind: 'arc',
              id: '5e6f7a8b-a2',
              sourceId: '9cabfc30-start',
              targetId: '3097cc0f-done',
              bendPoints: [],
              inscription: { text: 'p' },
              arcType: 'normal',
              drawMode: 'straight',
            },
          ],
        },
      ],
    });
  }

  function exportDoc(net: CpnNet): Document {
    return new DOMParser().parseFromString(serializeCpnXml(net), 'application/xml');
  }

  function allIds(doc: Document): string[] {
    return Array.from(doc.querySelectorAll('[id]')).map((el) => el.getAttribute('id')!);
  }

  it('gives every element a unique id, even when places share a colour set', () => {
    const ids = allIds(exportDoc(richNet()));
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses valid XML NCNames for every id and idref, and every idref resolves', () => {
    const doc = exportDoc(richNet());
    const ncName = /^[A-Za-z_][\w.-]*$/;
    const ids = allIds(doc);
    for (const id of ids) expect(id).toMatch(ncName);

    const idrefs = Array.from(doc.querySelectorAll('[idref]')).map(
      (el) => el.getAttribute('idref')!,
    );
    expect(idrefs.length).toBe(4); // two arcs × (transend + placeend)
    for (const ref of idrefs) {
      expect(ref).toMatch(ncName);
      expect(ids).toContain(ref);
    }
  });

  it('writes inscriptions with the full posattr/fillattr/lineattr/textattr/text sequence', () => {
    const doc = exportDoc(richNet());
    const inscriptions = Array.from(
      doc.querySelectorAll(
        'place > type, place > initmark, trans > cond, trans > time, arc > annot',
      ),
    );
    // 2 types + 1 initmark + 1 cond + 1 time + 2 annots
    expect(inscriptions).toHaveLength(7);
    for (const el of inscriptions) {
      expect(Array.from(el.children).map((c) => c.tagName)).toEqual([
        'posattr',
        'fillattr',
        'lineattr',
        'textattr',
        'text',
      ]);
    }
  });

  it('closes cpnet with instances, options, binders, monitorblock and IndexNode', () => {
    const net = richNet();
    net.pages.push({ id: '7f00-page2', name: 'Page 2', places: [], transitions: [], arcs: [] });
    const doc = exportDoc(net);

    const cpnet = doc.querySelector('workspaceElements > cpnet')!;
    expect(Array.from(cpnet.children).map((c) => c.tagName)).toEqual([
      'globbox',
      'page',
      'page',
      'instances',
      'options',
      'binders',
      'monitorblock',
      'IndexNode',
    ]);

    const pageIds = Array.from(cpnet.querySelectorAll(':scope > page')).map((p) => p.id);
    const instancePages = Array.from(cpnet.querySelectorAll(':scope > instances > instance')).map(
      (i) => i.getAttribute('page'),
    );
    expect(instancePages).toEqual(pageIds);
  });

  it('round-trips moved inscription labels through their posattr', () => {
    const net = richNet();
    const page = net.pages[0];
    page.places[0].labelOffsets = { colourSet: { x: 10, y: -5 }, marking: { x: -20, y: 30 } };
    page.transitions[0].labelOffsets = { guard: { x: 7, y: 8 }, duration: { x: -3, y: 12 } };
    page.arcs[0].labelOffsets = { inscription: { x: 15, y: 25 } };

    const back = parseCpnXml(serializeCpnXml(net)).pages[0];
    expect(back.places[0].labelOffsets).toEqual(page.places[0].labelOffsets);
    expect(back.transitions[0].labelOffsets).toEqual(page.transitions[0].labelOffsets);
    expect(back.arcs[0].labelOffsets).toEqual(page.arcs[0].labelOffsets);
  });

  it('leaves labels that were never moved without offsets after a round trip', () => {
    const back = parseCpnXml(serializeCpnXml(richNet())).pages[0];
    for (const el of [...back.places, ...back.transitions, ...back.arcs]) {
      expect(el.labelOffsets).toBeUndefined();
    }
  });
});

describe('serializeCpnXml — sample round trip (#1)', () => {
  /** Model content without ids: ids are remapped on export, so compare by structure. */
  function shape(net: CpnNet) {
    return {
      colourSets: net.colourSets.map(({ name, declaration, color }) => ({
        name,
        declaration,
        color,
      })),
      declarations: net.declarations,
      pages: net.pages.map((page) => {
        const nameOf = (id: string) =>
          [...page.places, ...page.transitions].find((e) => e.id === id)?.name;
        return {
          name: page.name,
          places: page.places.map(({ id: _id, ...rest }) => rest),
          transitions: page.transitions.map(({ id: _id, ...rest }) => rest),
          arcs: page.arcs.map(({ id: _id, sourceId, targetId, ...rest }) => ({
            ...rest,
            source: nameOf(sourceId),
            target: nameOf(targetId),
          })),
        };
      }),
    };
  }

  it('imports, exports and re-imports patient_punch_card.cpn to an equivalent model', async () => {
    const { readFileSync } = await import('node:fs');
    const original = parseCpnXml(readFileSync('../samples/patient_punch_card.cpn', 'latin1'));
    expect(original.pages[0].places.length).toBeGreaterThan(0);

    const reimported = parseCpnXml(serializeCpnXml(original));
    expect(shape(reimported)).toEqual(shape(original));
  });
});
