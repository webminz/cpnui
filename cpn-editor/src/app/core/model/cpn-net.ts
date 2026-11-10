import { Point, Size } from './geometry';

export type ArcType = 'normal' | 'inhibitor' | 'test';
export type ArcDrawMode = 'straight' | 'rounded' | 'bezier';

export interface ElementGraphics {
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export interface SmlExpression {
  text: string;
}

export interface ColourSet {
  id: string;
  name: string;
  declaration: string;
  color?: string;
}

export interface PlaceLabelOffsets {
  name?: Point;
  colourSet?: Point;
  marking?: Point;
}

export interface TransitionLabelOffsets {
  name?: Point;
  guard?: Point;
  duration?: Point;
}

export interface ArcLabelOffsets {
  inscription?: Point;
}

export interface Place {
  kind: 'place';
  id: string;
  name: string;
  position: Point;
  size: Size;
  colourSetId: string | null;
  initialMarking: SmlExpression;
  graphics?: ElementGraphics;
  labelOffsets?: PlaceLabelOffsets;
}

export interface Transition {
  kind: 'transition';
  id: string;
  name: string;
  position: Point;
  size: Size;
  guard: SmlExpression;
  duration: SmlExpression;
  graphics?: ElementGraphics;
  labelOffsets?: TransitionLabelOffsets;
}

export interface Arc {
  kind: 'arc';
  id: string;
  sourceId: string;
  targetId: string;
  bendPoints: Point[];
  inscription: SmlExpression;
  arcType: ArcType;
  drawMode: ArcDrawMode;
  graphics?: ElementGraphics;
  labelOffsets?: ArcLabelOffsets;
}

export type NetElement = Place | Transition;
export type NetObject = Place | Transition | Arc;

export interface Page {
  id: string;
  name: string;
  places: Place[];
  transitions: Transition[];
  arcs: Arc[];
}

export interface CpnNet {
  id: string;
  name: string;
  colourSets: ColourSet[];
  declarations: string;
  pages: Page[];
}
