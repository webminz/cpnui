import { parseCpnXml } from './cpn-import';

function wrap(inner: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<generator tool="CPN Tools" version="4.0.1" format="6"/>
<cpnet>
<globbox></globbox>
<page id="p1">
<pageattr name="Test Page"/>
${inner}
</page>
</cpnet>
</workspaceElements>`;
}

// Inline sample: a minimal version of PetriNet.cpn
const PETRI_NET_SAMPLE = `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<generator tool="CPN Tools" version="4.0.1" format="6"/>
<cpnet>
<globbox>
  <block id="ID1">
    <id>Standard declarations</id>
    <color id="c-int"><id>INT</id><int/><layout>colset INT = int;</layout></color>
    <color id="c-bool"><id>BOOL</id><bool/><layout>colset BOOL = bool;</layout></color>
    <var id="v1"><type><id>INT</id></type><id>var1</id><layout>var var1:INT;</layout></var>
  </block>
</globbox>
<page id="ID6">
  <pageattr name="Petri Net"/>
  <place id="a">
    <posattr x="-228" y="-94"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <text>start</text>
    <ellipse w="60.000000" h="40.000000"/>
    <type id="INT"><text>INT</text></type>
    <initmark id="a_initmark"><text>[1, 5, 5, 10]</text></initmark>
  </place>
  <place id="c">
    <posattr x="-6" y="-57"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <text>end place</text>
    <ellipse w="60.000000" h="40.000000"/>
    <type id="INT"><text>INT</text></type>
    <initmark id="c_initmark"><text></text></initmark>
  </place>
  <trans id="b">
    <posattr x="-100" y="-100"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>transition</text>
    <box w="60.000000" h="40.000000"/>
  </trans>
  <arc id="a-b" orientation="PtoT">
    <posattr x="0" y="0"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <arrowattr headsize="1.2" currentcyckle="2"/>
    <transend idref="b"/>
    <placeend idref="a"/>
    <annot id="a-b_ins"><text>var1</text></annot>
  </arc>
  <arc id="b-c" orientation="TtoP">
    <posattr x="0" y="0"/>
    <fillattr colour="White" pattern="" filled="false"/>
    <lineattr colour="Black" thick="1" type="Solid"/>
    <textattr colour="Black" bold="false"/>
    <arrowattr headsize="1.2" currentcyckle="2"/>
    <transend idref="b"/>
    <placeend idref="c"/>
    <annot id="b-c_ins"><text>var1</text></annot>
  </arc>
</page>
</cpnet>
</workspaceElements>`;

// Inline sample: a portion of ResourceAllocation.cpn with bend points
const RESOURCE_ALLOC_SAMPLE = `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<cpnet>
<globbox>
  <color id="id1231"><id>U</id><layout>colset U = enum(p,q);</layout></color>
  <color id="id1236"><id>I</id><int/><layout>colset I = int;</layout></color>
  <color id="id1239"><id>P</id><layout>colset P = product(U,I);</layout></color>
  <var id="id1248"><type><id>U</id></type><id>x</id><layout>var x:U;</layout></var>
  <var id="id1252"><type><id>I</id></type><id>i</id><layout>var i:I;</layout></var>
</globbox>
<page id="id4">
  <pageattr name="Top"/>
  <place id="id7">
    <posattr x="8.83" y="100.70"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>A</text>
    <ellipse w="7.42" h="6.71"/>
    <type id="id9"><text>P</text></type>
    <initmark id="id10"><text>3\`(q,0)</text></initmark>
  </place>
  <place id="id14">
    <posattr x="8.83" y="71.37"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>B</text>
    <ellipse w="6.71" h="7.42"/>
    <type id="id16"><text>P</text></type>
    <initmark id="id17"><text>2\`(p,0)</text></initmark>
  </place>
  <place id="id21">
    <posattr x="8.83" y="44.16"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>C</text>
    <ellipse w="6.71" h="7.42"/>
    <type id="id23"><text>P</text></type>
  </place>
  <place id="id71">
    <posattr x="-92.57" y="58.30"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Navy" thick="1" type="solid"/>
    <textattr colour="Navy" bold="false"/>
    <text>R</text>
    <ellipse w="5.30" h="7.42"/>
    <type id="id73"><text>E</text></type>
    <initmark id="id74"><text>1\`e</text></initmark>
  </place>
  <trans id="id39">
    <posattr x="-1.41" y="85.51"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>T1</text>
    <box w="17.31" h="5.30"/>
    <cond id="id44"><text>[x=q]</text></cond>
  </trans>
  <trans id="id46">
    <posattr x="-1.41" y="57.59"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>T2</text>
    <box w="17.31" h="5.30"/>
  </trans>
  <arc id="id96" orientation="PtoT">
    <posattr x="0" y="0"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="id39"/>
    <placeend idref="id7"/>
    <annot id="id98"><text>(x,i)</text></annot>
  </arc>
  <arc id="id102" orientation="TtoP">
    <posattr x="0" y="0"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="id39"/>
    <placeend idref="id14"/>
    <annot id="id104"><text>(x,i)</text></annot>
  </arc>
  <arc id="id144" orientation="TtoP">
    <posattr x="0" y="0"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="id46"/>
    <placeend idref="id7"/>
    <annot id="id146"><text>if x=q then 1\`(q,i+1) else empty</text></annot>
    <bendpoint id="id1041" serial="1">
      <posattr x="8.83" y="-31.09"/>
      <text></text>
    </bendpoint>
    <bendpoint id="id1040" serial="2">
      <posattr x="55.12" y="-31.09"/>
      <text></text>
    </bendpoint>
    <bendpoint id="id1039" serial="3">
      <posattr x="55.12" y="114.13"/>
      <text></text>
    </bendpoint>
    <bendpoint id="id1038" serial="4">
      <posattr x="8.83" y="114.13"/>
      <text></text>
    </bendpoint>
  </arc>
  <arc id="id148" orientation="PtoT">
    <posattr x="0" y="0"/>
    <lineattr colour="Navy" thick="0" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="id39"/>
    <placeend idref="id71"/>
    <annot id="id150"><text>e</text></annot>
    <bendpoint id="id1062" serial="1">
      <posattr x="-1.41" y="98.23"/>
      <text></text>
    </bendpoint>
    <bendpoint id="id1061" serial="2">
      <posattr x="-14.48" y="98.23"/>
      <text></text>
    </bendpoint>
  </arc>
</page>
</cpnet>
</workspaceElements>`;

describe('parseCpnXml', () => {
  it('should parse a minimal place', () => {
    const xml = wrap(`
      <place id="place1">
        <posattr x="100" y="50"/>
        <fillattr colour="White" pattern="" filled="false"/>
        <lineattr colour="Black" thick="1" type="Solid"/>
        <textattr colour="Black" bold="false"/>
        <text>MyPlace</text>
        <ellipse w="60" h="40"/>
        <type id="INT"><text>INT</text></type>
        <initmark id="im1"><text>1\`1</text></initmark>
      </place>
    `);
    const net = parseCpnXml(xml);
    expect(net.pages).toHaveLength(1);
    expect(net.pages[0].places).toHaveLength(1);

    const p = net.pages[0].places[0];
    expect(p.id).toBe('place1');
    expect(p.name).toBe('MyPlace');
    expect(p.position.x).toBe(100);
    expect(p.position.y).toBe(-50); // Y negated
    expect(p.size).toEqual({ width: 60, height: 40 });
    expect(p.colourSetId).toBe('INT');
    expect(p.initialMarking.text).toBe('1`1');
  });

  it('should parse a minimal transition', () => {
    const xml = wrap(`
      <trans id="t1">
        <posattr x="-100" y="200"/>
        <fillattr colour="White" pattern="" filled="false"/>
        <lineattr colour="Black" thick="2" type="solid"/>
        <textattr colour="Black" bold="false"/>
        <text>MyTrans</text>
        <box w="80" h="50"/>
        <cond id="c1"><text>[x&gt;0]</text></cond>
        <time id="tm1"><text>@+5</text></time>
      </trans>
    `);
    const net = parseCpnXml(xml);
    const t = net.pages[0].transitions[0];
    expect(t.id).toBe('t1');
    expect(t.name).toBe('MyTrans');
    expect(t.position.x).toBe(-100);
    expect(t.position.y).toBe(-200); // Y negated
    expect(t.size).toEqual({ width: 80, height: 50 });
    expect(t.guard.text).toBe('[x>0]');
    expect(t.duration.text).toBe('@+5');
  });

  it('should parse PtoT arc direction correctly', () => {
    const xml = wrap(`
      <place id="p1">
        <posattr x="0" y="0"/>
        <text>P1</text>
        <ellipse w="40" h="40"/>
      </place>
      <trans id="t1">
        <posattr x="100" y="0"/>
        <text>T1</text>
        <box w="60" h="40"/>
      </trans>
      <arc id="a1" orientation="PtoT">
        <posattr x="0" y="0"/>
        <fillattr colour="White" pattern="" filled="false"/>
        <lineattr colour="Black" thick="1" type="Solid"/>
        <textattr colour="Black" bold="false"/>
        <arrowattr headsize="1.2" currentcyckle="2"/>
        <transend idref="t1"/>
        <placeend idref="p1"/>
        <annot id="ann1"><text>x</text></annot>
      </arc>
    `);
    const net = parseCpnXml(xml);
    const arc = net.pages[0].arcs[0];
    expect(arc.sourceId).toBe('p1'); // place is source in PtoT
    expect(arc.targetId).toBe('t1');
    expect(arc.inscription.text).toBe('x');
  });

  it('should parse TtoP arc direction correctly', () => {
    const xml = wrap(`
      <place id="p1">
        <posattr x="0" y="0"/>
        <text>P1</text>
        <ellipse w="40" h="40"/>
      </place>
      <trans id="t1">
        <posattr x="100" y="0"/>
        <text>T1</text>
        <box w="60" h="40"/>
      </trans>
      <arc id="a1" orientation="TtoP">
        <posattr x="0" y="0"/>
        <transend idref="t1"/>
        <placeend idref="p1"/>
      </arc>
    `);
    const net = parseCpnXml(xml);
    const arc = net.pages[0].arcs[0];
    expect(arc.sourceId).toBe('t1'); // transition is source in TtoP
    expect(arc.targetId).toBe('p1');
  });

  it('should parse arc bend points sorted by serial', () => {
    const xml = wrap(`
      <place id="p1"><posattr x="0" y="0"/><text>P1</text><ellipse w="40" h="40"/></place>
      <trans id="t1"><posattr x="100" y="0"/><text>T1</text><box w="60" h="40"/></trans>
      <arc id="a1" orientation="PtoT">
        <posattr x="0" y="0"/>
        <transend idref="t1"/>
        <placeend idref="p1"/>
        <bendpoint id="bp2" serial="2">
          <posattr x="80" y="20"/>
          <text></text>
        </bendpoint>
        <bendpoint id="bp1" serial="1">
          <posattr x="40" y="10"/>
          <text></text>
        </bendpoint>
        <bendpoint id="bp3" serial="3">
          <posattr x="90" y="5"/>
          <text></text>
        </bendpoint>
      </arc>
    `);
    const net = parseCpnXml(xml);
    const arc = net.pages[0].arcs[0];
    expect(arc.bendPoints).toHaveLength(3);
    expect(arc.bendPoints[0].x).toBe(40);  // serial 1
    expect(arc.bendPoints[1].x).toBe(80);  // serial 2
    expect(arc.bendPoints[2].x).toBe(90);  // serial 3
  });

  it('should parse place graphics attributes', () => {
    const xml = wrap(`
      <place id="p1">
        <posattr x="0" y="0"/>
        <fillattr colour="Red" pattern="" filled="false"/>
        <lineattr colour="Blue" thick="3" type="Solid"/>
        <textattr colour="Green" bold="true"/>
        <text>P1</text>
        <ellipse w="40" h="40"/>
      </place>
    `);
    const net = parseCpnXml(xml);
    const g = net.pages[0].places[0].graphics!;
    expect(g.fillColor).toBe('#ff0000');
    expect(g.strokeColor).toBe('#0000ff');
    expect(g.strokeWidth).toBe(3);
    expect(g.fontColor).toBe('#008000');
    expect(g.fontBold).toBe(true);
  });

  it('should parse globbox colour sets', () => {
    const xml = `<?xml version="1.0"?>
<workspaceElements>
<cpnet>
<globbox>
  <color id="c1"><id>INT</id><int/><layout>colset INT = int;</layout></color>
  <color id="c2"><id>BOOL</id><bool/><layout>colset BOOL = bool;</layout></color>
</globbox>
<page id="p1"><pageattr name="Page"/></page>
</cpnet>
</workspaceElements>`;
    const net = parseCpnXml(xml);
    expect(net.colourSets).toHaveLength(2);
    expect(net.colourSets[0].name).toBe('INT');
    expect(net.colourSets[0].declaration).toBe('colset INT = int;');
    expect(net.colourSets[1].name).toBe('BOOL');
  });

  it('should handle missing optional fields gracefully', () => {
    const xml = wrap(`
      <place id="p1">
        <posattr x="10" y="20"/>
        <text>P</text>
      </place>
      <trans id="t1">
        <posattr x="50" y="60"/>
        <text>T</text>
      </trans>
    `);
    const net = parseCpnXml(xml);
    const p = net.pages[0].places[0];
    expect(p.size).toEqual({ width: 50, height: 50 });
    expect(p.colourSetId).toBeNull();
    expect(p.initialMarking.text).toBe('');

    const t = net.pages[0].transitions[0];
    expect(t.size).toEqual({ width: 60, height: 40 }); // defaults
    expect(t.guard.text).toBe('');
    expect(t.duration.text).toBe('');
  });

  it('should parse the PetriNet sample', () => {
    const net = parseCpnXml(PETRI_NET_SAMPLE);

    expect(net.pages).toHaveLength(1);
    expect(net.pages[0].name).toBe('Petri Net');
    expect(net.pages[0].places).toHaveLength(2);
    expect(net.pages[0].transitions).toHaveLength(1);
    expect(net.pages[0].arcs).toHaveLength(2);

    const placeNames = net.pages[0].places.map((p) => p.name).sort();
    expect(placeNames).toEqual(['end place', 'start']);

    const startPlace = net.pages[0].places.find((p) => p.name === 'start')!;
    expect(startPlace.colourSetId).toBe('INT');
    expect(startPlace.initialMarking.text).toBe('[1, 5, 5, 10]');

    // Colour sets from globbox
    expect(net.colourSets).toHaveLength(2);
    expect(net.colourSets[0].name).toBe('INT');
  });

  it('should parse ResourceAllocation sample with bend points', () => {
    const net = parseCpnXml(RESOURCE_ALLOC_SAMPLE);

    expect(net.pages).toHaveLength(1);
    expect(net.pages[0].places).toHaveLength(4);
    expect(net.pages[0].transitions).toHaveLength(2);
    expect(net.pages[0].arcs).toHaveLength(4);

    // Check bend points on the arc with 4 bend points
    const arcWith4 = net.pages[0].arcs.find((a) => a.id === 'id144')!;
    expect(arcWith4.bendPoints).toHaveLength(4);
    // Verify they're sorted by serial
    expect(arcWith4.bendPoints[0].x).toBeCloseTo(8.83, 1);
    expect(arcWith4.bendPoints[3].x).toBeCloseTo(8.83, 1);

    // Check transition guard
    const t1 = net.pages[0].transitions.find((t) => t.name === 'T1')!;
    expect(t1.guard.text).toBe('[x=q]');

    // Verify colour sets
    expect(net.colourSets.length).toBeGreaterThanOrEqual(3);
  });

  it('should throw for invalid XML without cpnet element', () => {
    expect(() => parseCpnXml('<root></root>')).toThrow('Invalid CPN XML');
  });
});

// ---------------------------------------------------------------------------
// Legacy (format 2) declarations without <layout>, graphics defaults, scaling
// ---------------------------------------------------------------------------

import { computeNormalizationScale, normalizeNetScale } from './cpn-import';

const LEGACY_GLOBBOX = `<?xml version="1.0" encoding="iso-8859-1"?>
<workspaceElements>
<generator tool="CPN Tools" version="0.1.69.1" format="2"/>
<cpnet>
<globbox>
  <color id="id1407"><id>INT</id><timed/><int/></color>
  <color id="id1411"><id>DATA</id><string/></color>
  <color id="id1414"><id>INTxDATA</id><timed/><product><id>INT</id><id>DATA</id></product></color>
  <var id="id1419"><type><id>INT</id></type><id>n</id><id>k</id><id>wait</id></var>
  <var id="id1424"><type><id>DATA</id></type><id>p</id><id>str</id></var>
  <ml id="id1429">val stop = "########";</ml>
  <color id="id1430"><id>Ten0</id><int><with><ml>0</ml><ml>10</ml></with></int></color>
  <color id="id1431"><id>U</id><enum><id>p</id><id>q</id></enum></color>
  <color id="id1432"><id>REC</id><record><recordfield><id>a</id><id>INT</id></recordfield><recordfield><id>b</id><id>DATA</id></recordfield></record></color>
  <color id="id1433"><id>LST</id><list><id>INT</id></list></color>
  <color id="id1434"><id>UN</id><union><unionfield><id>Left</id><id>INT</id></unionfield><unionfield><id>None</id></unionfield></union></color>
  <color id="id1435"><id>SUB</id><subset><id>INT</id><by><ml>fn x => x > 0</ml></by></subset></color>
  <color id="id1436"><id>IDX</id><index><id>ph</id><ml>1</ml><ml>5</ml></index></color>
  <color id="id1437"><id>ALIAS</id><alias><id>INT</id></alias></color>
  <color id="id1438"><id>E</id><unit><with><ml>e</ml></with></unit></color>
  <ml id="id1452">fun OK(s:Ten0,r:Ten1) = (r&lt;=s);</ml>
  <block id="ID1">
    <id>Standard priorities</id>
    <ml id="idp">val P_HIGH = 100;<layout>val P_HIGH = 100;</layout></ml>
  </block>
</globbox>
<page id="p1">
  <pageattr name="Top"/>
  <place id="pl1">
    <posattr x="54.06" y="55.83"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="1" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>NextRec</text>
    <ellipse w="23.32" h="8.13"/>
    <type id="t1"><text>INT</text></type>
    <initmark id="im1"><text>1</text></initmark>
  </place>
  <place id="pl2">
    <posattr x="-98.94" y="109.54"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Navy" thick="1" type="solid"/>
    <textattr colour="Navy" bold="false"/>
    <text>Send</text>
    <ellipse w="25.80" h="8.13"/>
  </place>
  <trans id="tr1">
    <posattr x="-57.95" y="86.93"/>
    <fillattr colour="White" pattern="solid" filled="false"/>
    <lineattr colour="Black" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <text>Send
Packet</text>
    <box w="21.55" h="13.07"/>
  </trans>
  <arc id="a1" orientation="PtoT">
    <posattr x="0" y="0"/>
    <fillattr colour="Navy" pattern="solid" filled="false"/>
    <lineattr colour="Navy" thick="2" type="solid"/>
    <textattr colour="Black" bold="false"/>
    <transend idref="tr1"/>
    <placeend idref="pl1"/>
    <bendpoint id="bp1" serial="1"><posattr x="10" y="-20"/><text></text></bendpoint>
    <annot id="an1"><text>(n,p)</text></annot>
  </arc>
</page>
</cpnet>
</workspaceElements>`;

describe('parseCpnXml — legacy format without <layout>', () => {
  it('reconstructs colour set declarations from the structured XML', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    const decl = (name: string) => net.colourSets.find((c) => c.name === name)!.declaration;

    expect(decl('INT')).toBe('colset INT = int timed;');
    expect(decl('DATA')).toBe('colset DATA = string;');
    expect(decl('INTxDATA')).toBe('colset INTxDATA = product INT * DATA timed;');
    expect(decl('Ten0')).toBe('colset Ten0 = int with 0..10;');
    expect(decl('U')).toBe('colset U = with p | q;');
    expect(decl('REC')).toBe('colset REC = record a:INT * b:DATA;');
    expect(decl('LST')).toBe('colset LST = list INT;');
    expect(decl('UN')).toBe('colset UN = union Left:INT + None;');
    expect(decl('SUB')).toBe('colset SUB = subset INT by fn x => x > 0;');
    expect(decl('IDX')).toBe('colset IDX = index ph with 1..5;');
    expect(decl('ALIAS')).toBe('colset ALIAS = INT;');
    expect(decl('E')).toBe('colset E = unit with e;');
  });

  it('assigns a palette colour to every imported colour set', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    for (const cs of net.colourSets) {
      expect(cs.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('reconstructs variable and value declarations in document order', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    const lines = net.declarations.split('\n');
    expect(lines).toEqual([
      'var n, k, wait : INT;',
      'var p, str : DATA;',
      'val stop = "########";',
      'fun OK(s:Ten0,r:Ten1) = (r<=s);',
      '(* Standard priorities *)',
      'val P_HIGH = 100;',
    ]);
  });

  it('does not leak <ml> range bounds nested inside <color> into the declarations', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    expect(net.declarations).not.toMatch(/^0$/m);
    expect(net.declarations).not.toMatch(/^10$/m);
  });

  it('treats Black/White CPN Tools defaults as unset graphics', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    const p1 = net.pages[0].places.find((p) => p.id === 'pl1')!;
    expect(p1.graphics?.strokeColor).toBeUndefined();
    expect(p1.graphics?.fillColor).toBeUndefined();
    expect(p1.graphics?.fontColor).toBeUndefined();

    const p2 = net.pages[0].places.find((p) => p.id === 'pl2')!;
    expect(p2.graphics?.strokeColor).toBe('#000080'); // Navy
    expect(p2.graphics?.fontColor).toBe('#000080');
  });

  it('keeps explicit fill when filled="true"', () => {
    const xml = wrap(`
      <place id="p1">
        <posattr x="0" y="0"/>
        <fillattr colour="White" pattern="solid" filled="true"/>
        <text>P1</text>
        <ellipse w="40" h="40"/>
      </place>
    `);
    const net = parseCpnXml(xml);
    expect(net.pages[0].places[0].graphics?.fillColor).toBe('#ffffff');
  });

  it('reads the editor colour hint comment from <color>', () => {
    const xml = `<?xml version="1.0"?>
<workspaceElements><cpnet><globbox>
  <color id="c1"><!-- cpn-editor:colour=#ec4899 --><id>INT</id><int/><layout>colset INT = int;</layout></color>
</globbox><page id="p1"><pageattr name="Page"/></page></cpnet></workspaceElements>`;
    const net = parseCpnXml(xml);
    expect(net.colourSets[0].color).toBe('#ec4899');
  });

  it('keeps multi-line names', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    expect(net.pages[0].transitions[0].name).toBe('Send\nPacket');
  });
});

describe('normalizeNetScale', () => {
  it('scales tiny legacy nets up to the reference place height', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    const factor = computeNormalizationScale(net);
    expect(factor).toBeCloseTo(40 / 8.13, 3);

    const scaled = normalizeNetScale(net);
    const p1 = scaled.pages[0].places.find((p) => p.id === 'pl1')!;
    expect(p1.size.height).toBeCloseTo(40, 3);
    expect(p1.size.width).toBeCloseTo(23.32 * factor, 3);
    expect(p1.position.x).toBeCloseTo(54.06 * factor, 3);
    expect(p1.position.y).toBeCloseTo(-55.83 * factor, 3);

    const t = scaled.pages[0].transitions[0];
    expect(t.size.width).toBeCloseTo(21.55 * factor, 3);

    const bp = scaled.pages[0].arcs[0].bendPoints[0];
    expect(bp.x).toBeCloseTo(10 * factor, 3);
    expect(bp.y).toBeCloseTo(20 * factor, 3);
  });

  it('leaves nets at the modern CPN Tools scale untouched', () => {
    const net = parseCpnXml(PETRI_NET_SAMPLE);
    expect(computeNormalizationScale(net)).toBe(1);
    expect(normalizeNetScale(net)).toBe(net);
  });

  it('does not touch the original net', () => {
    const net = parseCpnXml(LEGACY_GLOBBOX);
    normalizeNetScale(net);
    expect(net.pages[0].places[0].size.height).toBeCloseTo(8.13, 3);
  });
});
