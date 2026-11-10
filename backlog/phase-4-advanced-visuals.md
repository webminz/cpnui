# Phase 4: Advanced visuals

Status: DONE

- [X] Line bend-points
- [X] Line drawing mode: straight, rounded, bezier
- [X] Resizable elements
- [X] Graphical decorations


## Line bend-points

Lines shall have _bend points_ to allow for complex layouts.
The user interaction shall be as follows:
When an arc is selected, a visual indicator knob appears (**important**: the knob should not interfere with the presentation of labels, for instance).
The user may "drag" this knob, causing the it to be reified as a bend point. 
If a line already has a bend point, it shows knob on every segment such that is is possible to create more bend-points recursively.
There must also be a possibility to remove bend points again.

## Line drawing modes

In combination with line "bend points", one is also able to customize the visualization by toggling between the modes:

- `straight`
- `rounded` and 
- `bezier`

In `straight` mode (which is the default mode), an arc is represented by straight line segments between each bend point.
In `rounded` mode, at each bend point, the angle between segments is "softened" a bit by using a pre-configured _curvature_ bezier 
configuration based on the coordinates of the bend point and the end point of the adjacent segments.
In `bezier` mode, the bend points act as the _support points_, which allows the user to draw artistic curved connectors.

## Resizable elements

Places and transations shall be resizable, i.e. once a place or transition is selected, it also shows some virtual "resize"-knobs
in the four corners. When the user decides to drag them inwards or outwards, the respective elements get smaller or bigger, respectively.

## Graphical decorations

All graphical elements should be customizable, i.e. the property panel has to be extended to customize 
not only a semantic properties but also visual ones.
In the first iteration this could be:

- `font-size`
- `font-color`
- `font-family`
- `font-style` (bold, italic, underlined)
- `stroke-color`
- `stroke-width`
- `fill-color`


To separate the graphical from the semantic properties, they could be shown in a separate tab pane of the property panel.
Each property should have a respective ergonomic input method, e.g., a color picker, font-preview, etc.
(you may want to resort to some existing popular library solutions. BUT: stick with permissive licenses, i.e. MIT, Apache and similar).

