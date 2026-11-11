import { Arc, CpnNet, ElementGraphics, Page, Place, Point, Transition } from '../core/model';
import {
  addOffset,
  arcInscriptionAnchor,
  placeLabelAnchors,
  transitionLabelAnchors,
} from './label-anchors';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parse an SML colour set declaration and return the structured type XML.
 * Input: 'colset NAME = BODY [timed];'
 * Output: '<unit/>' or '<int><with>...</with></int>' etc (without <timed/>)
 * Returns '' if unparsable.
 */
function colourSetTypeXml(declaration: string): string {
  const trimmed = declaration.trim();
  if (!trimmed.startsWith('colset ')) return '';

  // Extract "NAME = BODY;" from "colset NAME = BODY;"
  const m = /^colset\s+\w+\s*=\s*(.*?);?\s*$/.exec(trimmed);
  if (!m) return '';

  let body = m[1].trim();

  // Strip trailing " timed" (case-sensitive, SML is lowercase)
  const timedMatch = /^(.*?)\s+timed$/s.exec(body);
  if (timedMatch) {
    body = timedMatch[1].trim();
  }

  // Normalize whitespace around operators for easier parsing
  body = body.replace(/\s*\*\s*/g, ' * ').replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*\|\s*/g, ' | ').replace(/\s*:\s*/g, ':')
    .replace(/\s*\.\.\s*/g, '..').replace(/\s*,\s*/g, ', ');

  // Match against known patterns
  if (body === '()' || body === 'unit') return '<unit/>';
  if (body === 'bool') return '<bool/>';
  if (body === 'int') return '<int/>';
  if (body === 'intinf') return '<intinf/>';
  if (body === 'real') return '<real/>';
  if (body === 'time') return '<time/>';
  if (body === 'string') return '<string/>';

  // "unit with X"
  const unitWithM = /^unit\s+with\s+(.+)$/.exec(body);
  if (unitWithM) {
    const val = esc(unitWithM[1]);
    return `<unit><with><ml>${val}</ml></with></unit>`;
  }

  // "bool with (A, B)"
  const boolWithM = /^bool\s+with\s+\((.+?),\s*(.+?)\)$/.exec(body);
  if (boolWithM) {
    const a = esc(boolWithM[1].trim());
    const b = esc(boolWithM[2].trim());
    return `<bool><with><ml>${a}</ml><ml>${b}</ml></with></bool>`;
  }

  // "int with LO..HI"
  const intWithM = /^int\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (intWithM) {
    const lo = esc(intWithM[1].trim());
    const hi = esc(intWithM[2].trim());
    return `<int><with><ml>${lo}</ml><ml>${hi}</ml></with></int>`;
  }

  // "intinf [with LO..HI]"
  const intinfWithM = /^intinf\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (intinfWithM) {
    const lo = esc(intinfWithM[1].trim());
    const hi = esc(intinfWithM[2].trim());
    return `<intinf><with><ml>${lo}</ml><ml>${hi}</ml></with></intinf>`;
  }

  // "real [with LO..HI]"
  const realWithM = /^real\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (realWithM) {
    const lo = esc(realWithM[1].trim());
    const hi = esc(realWithM[2].trim());
    return `<real><with><ml>${lo}</ml><ml>${hi}</ml></with></real>`;
  }

  // "string [with A..B [and LO..HI]]"
  const stringWithAndM =
    /^string\s+with\s+(.+?)\.\.(.+?)\s+and\s+(.+?)\.\.(.+)$/.exec(body);
  if (stringWithAndM) {
    const a = esc(stringWithAndM[1].trim());
    const b = esc(stringWithAndM[2].trim());
    const lo = esc(stringWithAndM[3].trim());
    const hi = esc(stringWithAndM[4].trim());
    return (
      `<string><with><ml>${a}</ml><ml>${b}</ml></with>` +
      `<and><ml>${lo}</ml><ml>${hi}</ml></and></string>`
    );
  }

  const stringWithM = /^string\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (stringWithM) {
    const a = esc(stringWithM[1].trim());
    const b = esc(stringWithM[2].trim());
    return `<string><with><ml>${a}</ml><ml>${b}</ml></with></string>`;
  }

  // "with a | b | c" (enum)
  const enumM = /^with\s+(.+)$/.exec(body);
  if (enumM) {
    const items = enumM[1].split('|').map((s) => esc(s.trim()));
    const ids = items.map((id) => `<id>${id}</id>`).join('');
    return `<enum>${ids}</enum>`;
  }

  // "index NAME with LO..HI"
  const indexM = /^index\s+(\w+)\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (indexM) {
    const name = esc(indexM[1]);
    const lo = esc(indexM[2].trim());
    const hi = esc(indexM[3].trim());
    return `<index><ml>${lo}</ml><ml>${hi}</ml><id>${name}</id></index>`;
  }

  // "product A * B * C"
  const productM = /^product\s+(.+)$/.exec(body);
  if (productM) {
    const items = productM[1].split('*').map((s) => esc(s.trim()));
    const ids = items.map((id) => `<id>${id}</id>`).join('');
    return `<product>${ids}</product>`;
  }

  // "record a:A * b:B"
  const recordM = /^record\s+(.+)$/.exec(body);
  if (recordM) {
    const items = recordM[1].split('*').map((s) => s.trim());
    const fields = items
      .map((field) => {
        const [name, type] = field.split(':').map((s) => s.trim());
        if (name && type) {
          return `<recordfield><id>${esc(name)}</id><id>${esc(type)}</id></recordfield>`;
        }
        return '';
      })
      .join('');
    return `<record>${fields}</record>`;
  }

  // "list A [with LO..HI]"
  const listWithM = /^list\s+(\w+)\s+with\s+(.+?)\.\.(.+)$/.exec(body);
  if (listWithM) {
    const elem = esc(listWithM[1]);
    const lo = esc(listWithM[2].trim());
    const hi = esc(listWithM[3].trim());
    return `<list><id>${elem}</id><with><ml>${lo}</ml><ml>${hi}</ml></with></list>`;
  }

  const listM = /^list\s+(\w+)$/.exec(body);
  if (listM) {
    const elem = esc(listM[1]);
    return `<list><id>${elem}</id></list>`;
  }

  // "union a:A + b + c:C"
  const unionM = /^union\s+(.+)$/.exec(body);
  if (unionM) {
    const items = unionM[1].split('+').map((s) => s.trim());
    const fields = items
      .map((field) => {
        const colonIdx = field.indexOf(':');
        if (colonIdx > 0) {
          const name = esc(field.substring(0, colonIdx).trim());
          const type = esc(field.substring(colonIdx + 1).trim());
          return `<unionfield><id>${name}</id><id>${type}</id></unionfield>`;
        }
        const name = esc(field);
        return `<unionfield><id>${name}</id></unionfield>`;
      })
      .join('');
    return `<union>${fields}</union>`;
  }

  // "subset A by F"
  const subsetByM = /^subset\s+(\w+)\s+by\s+(.+)$/.exec(body);
  if (subsetByM) {
    const base = esc(subsetByM[1]);
    const fn = esc(subsetByM[2]);
    return `<subset><id>${base}</id><by><ml>${fn}</ml></by></subset>`;
  }

  // "subset A with [x, y]"
  const subsetWithM = /^subset\s+(\w+)\s+with\s+\[(.+)\]$/.exec(body);
  if (subsetWithM) {
    const base = esc(subsetWithM[1]);
    const items = subsetWithM[2].split(',').map((s) => esc(s.trim()));
    const mls = items.map((ml) => `<ml>${ml}</ml>`).join('');
    return `<subset><id>${base}</id><with>${mls}</with></subset>`;
  }

  // Bare identifier (alias)
  if (/^\w+$/.test(body)) {
    const id = esc(body);
    return `<alias><id>${id}</id></alias>`;
  }

  return '';
}

/**
 * Allocates CPN Tools–style ids (`ID1`, `ID2`, …) for one export. CPN Tools needs every id
 * to be a unique XML NCName; editor ids are UUIDs (often starting with a digit), so they are
 * remapped.
 */
class IdAllocator {
  private next = 1;
  private readonly mapped = new Map<string, string>();

  /** A new id for an element with no editor id (labels, bend points, declarations). */
  fresh(): string {
    return `ID${this.next++}`;
  }

  /** The stable id for an editor id, so idrefs resolve to the same element. */
  of(modelId: string): string {
    let id = this.mapped.get(modelId);
    if (!id) {
      id = this.fresh();
      this.mapped.set(modelId, id);
    }
    return id;
  }
}

function graphicsAttrs(g?: ElementGraphics): string {
  const fill = g?.fillColor ?? 'White';
  const filled = g?.fillColor ? 'true' : 'false';
  const stroke = g?.strokeColor ?? 'Black';
  const thick = g?.strokeWidth ?? 1;
  const fontColor = g?.fontColor ?? 'Black';
  const bold = g?.fontBold ? 'true' : 'false';

  return [
    `<fillattr colour="${esc(fill)}" pattern="" filled="${filled}"/>`,
    `<lineattr colour="${esc(stroke)}" thick="${thick}" type="solid"/>`,
    `<textattr colour="${esc(fontColor)}" bold="${bold}"/>`,
  ].join('\n');
}

/**
 * An inscription (colour set, marking, guard, delay, arc annotation). CPN Tools requires the full
 * posattr/fillattr/lineattr/textattr/text sequence; `pos` is in editor coordinates (Y down).
 */
function inscriptionXml(tag: string, id: string, pos: Point, text: string): string {
  return `<${tag} id="${id}">
<posattr x="${pos.x.toFixed(6)}" y="${(-pos.y).toFixed(6)}"/>
<fillattr colour="White" pattern="Solid" filled="false"/>
<lineattr colour="Black" thick="0" type="Solid"/>
<textattr colour="Black" bold="false"/>
<text>${esc(text)}</text>
</${tag}>`;
}

function serializePlace(p: Place, ids: IdAllocator): string {
  const x = p.position.x;
  const y = -p.position.y; // negate Y back for CPN Tools
  const w = p.size.width.toFixed(6);
  const h = p.size.height.toFixed(6);

  const anchors = placeLabelAnchors(p);
  const offsets = p.labelOffsets;

  let typeXml = '';
  if (p.colourSetId) {
    const pos = addOffset(anchors.colourSet, offsets?.colourSet);
    typeXml = inscriptionXml('type', ids.fresh(), pos, p.colourSetId);
  }

  let initmarkXml = '';
  if (p.initialMarking.text) {
    const pos = addOffset(anchors.marking, offsets?.marking);
    initmarkXml = inscriptionXml('initmark', ids.fresh(), pos, p.initialMarking.text);
  }

  return `<place id="${ids.of(p.id)}">
<posattr x="${x}" y="${y}"/>
${graphicsAttrs(p.graphics)}
<text>${esc(p.name)}</text>
<ellipse w="${w}" h="${h}"/>
${typeXml}
${initmarkXml}
</place>`;
}

function serializeTransition(t: Transition, ids: IdAllocator): string {
  const x = t.position.x;
  const y = -t.position.y;

  const anchors = transitionLabelAnchors(t);
  const offsets = t.labelOffsets;

  let condXml = '';
  if (t.guard.text) {
    const pos = addOffset(anchors.guard, offsets?.guard);
    condXml = inscriptionXml('cond', ids.fresh(), pos, t.guard.text);
  }

  let timeXml = '';
  if (t.duration.text) {
    let durationText = t.duration.text.trim();
    // CPN Tools time inscriptions must start with @+
    if (durationText && !durationText.startsWith('@+')) {
      durationText = '@+' + durationText;
    }
    const pos = addOffset(anchors.duration, offsets?.duration);
    timeXml = inscriptionXml('time', ids.fresh(), pos, durationText);
  }

  return `<trans id="${ids.of(t.id)}">
<posattr x="${x}" y="${y}"/>
${graphicsAttrs(t.graphics)}
<text>${esc(t.name)}</text>
<box w="${t.size.width.toFixed(6)}" h="${t.size.height.toFixed(6)}"/>
${condXml}
${timeXml}
</trans>`;
}

function serializeArc(a: Arc, page: Page, ids: IdAllocator): string {
  // Determine orientation based on source/target kinds
  const isSourcePlace =
    page.places.some((p) => p.id === a.sourceId);

  let orientation: string;
  let transendRef: string;
  let placeendRef: string;
  if (isSourcePlace) {
    orientation = 'PtoT';
    placeendRef = a.sourceId;
    transendRef = a.targetId;
  } else {
    orientation = 'TtoP';
    transendRef = a.sourceId;
    placeendRef = a.targetId;
  }

  let bendpointsXml = '';
  for (let i = 0; i < a.bendPoints.length; i++) {
    const bp = a.bendPoints[i];
    bendpointsXml += `<bendpoint id="${ids.fresh()}" serial="${i + 1}">
<posattr x="${bp.x}" y="${-bp.y}"/>
<fillattr colour="White" pattern="Solid" filled="false"/>
<lineattr colour="Black" thick="0" type="Solid"/>
<textattr colour="Black" bold="false"/>
<text></text>
</bendpoint>\n`;
  }

  let annotXml = '';
  if (a.inscription.text) {
    const pos = addOffset(arcInscriptionAnchor(a, page), a.labelOffsets?.inscription);
    annotXml = inscriptionXml('annot', ids.fresh(), pos, a.inscription.text);
  }

  return `<arc id="${ids.of(a.id)}" orientation="${orientation}">
<posattr x="0.000000" y="0.000000"/>
${graphicsAttrs(a.graphics)}
<arrowattr headsize="1.200000" currentcyckle="2"/>
<transend idref="${ids.of(transendRef)}"/>
<placeend idref="${ids.of(placeendRef)}"/>
${bendpointsXml}${annotXml}
</arc>`;
}

function serializeGlobbox(net: CpnNet, ids: IdAllocator): string {
  let colorsXml = '';
  for (const cs of net.colourSets) {
    // The colour-set colour is editor-specific; an XML comment keeps the file
    // valid for CPN Tools while allowing a lossless round trip.
    const hint = cs.color ? `<!-- cpn-editor:colour=${cs.color} -->\n` : '';

    // Generate structured type XML
    const typeXml = colourSetTypeXml(cs.declaration);

    // Check if declaration ends with " timed" (optionally followed by semicolon)
    const declaration = cs.declaration.trim();
    const timedRegex = /\s+timed\s*;?\s*$/;
    const isTimed = timedRegex.test(declaration);
    const timedXml = isTimed ? '<timed/>' : '';

    // Build colour element with proper ordering: id, timed (if present),
    // structured type (if parseable), then layout
    let colourContent = `${hint}<id>${esc(cs.name)}</id>\n`;
    if (timedXml) colourContent += timedXml + '\n';
    if (typeXml) colourContent += typeXml + '\n';
    colourContent += `<layout>${esc(cs.declaration)}</layout>`;

    colorsXml += `<color id="${ids.of(cs.id)}">
${colourContent}
</color>\n`;
  }

  let declsXml = '';
  if (net.declarations) {
    const lines = net.declarations.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        // Check if this is a variable declaration: var x, y, z : TYPE;
        const varMatch = /^var\s+([\w',\s]+?)\s*:\s*(\w+)\s*;?\s*$/.exec(line.trim());
        if (varMatch) {
          // Parse variable names (comma-separated)
          const namesStr = varMatch[1];
          const typeStr = varMatch[2];
          const names = namesStr.split(',').map((s) => s.trim()).filter((s) => s);

          // Create <var> element
          let varContent = `<type><id>${esc(typeStr)}</id></type>\n`;
          for (const name of names) {
            varContent += `<id>${esc(name)}</id>\n`;
          }
          varContent += `<layout>${esc(line.trim())}</layout>`;

          declsXml += `<var id="${ids.fresh()}">
${varContent}
</var>\n`;
        } else {
          // Regular ML declaration
          declsXml += `<ml id="${ids.fresh()}">
${esc(line.trim())}
<layout>${esc(line.trim())}</layout>
</ml>\n`;
        }
      }
    }
  }

  return `<globbox>
${colorsXml}${declsXml}</globbox>`;
}

function serializePage(page: Page, ids: IdAllocator): string {
  const places = page.places.map((p) => serializePlace(p, ids)).join('\n');
  const transitions = page.transitions.map((t) => serializeTransition(t, ids)).join('\n');
  const arcs = page.arcs.map((a) => serializeArc(a, page, ids)).join('\n');

  return `<page id="${ids.of(page.id)}">
<pageattr name="${esc(page.name)}"/>
${places}
${transitions}
${arcs}
</page>`;
}

/**
 * The sections CPN Tools writes after the pages. Kept minimal: one instance per page, and one
 * binder with a sheet per instance so the pages open on load. Options/IndexNode are left to
 * CPN Tools' defaults.
 */
function trailerXml(net: CpnNet, ids: IdAllocator): string {
  const instances = net.pages.map((page) => ({ id: ids.fresh(), page: ids.of(page.id) }));
  const sheets = instances
    .map((inst, i) => {
      const view = 'panx="0.000000" pany="0.000000" zoom="1.000000"';
      return `<cpnsheet id="${ids.fresh()}" ${view} instance="${inst.id}">
<zorder><position value="${i}"/></zorder>
</cpnsheet>`;
    })
    .join('\n');

  return `<instances>
${instances.map((inst) => `<instance id="${inst.id}" page="${inst.page}"/>`).join('\n')}
</instances>
<options/>
<binders>
<cpnbinder id="${ids.fresh()}" x="0" y="0" width="1200" height="700">
<sheets>
${sheets}
</sheets>
<zorder><position value="0"/></zorder>
</cpnbinder>
</binders>
<monitorblock name="Monitors"/>
<IndexNode expanded="true"/>`;
}

export function serializeCpnXml(net: CpnNet): string {
  const ids = new IdAllocator();
  const globbox = serializeGlobbox(net, ids);
  const pages = net.pages.map((p) => serializePage(p, ids)).join('\n');

  return `<?xml version="1.0" encoding="iso-8859-1"?>
<!DOCTYPE workspaceElements PUBLIC "-//CPN//DTD CPNXML 1.0//EN" "http://cpntools.org/DTD/6/cpn.dtd">
<workspaceElements>
<generator tool="CPN Editor" version="1.0.0" format="6"/>
<cpnet>
${globbox}
${pages}
${trailerXml(net, ids)}
</cpnet>
</workspaceElements>`;
}
