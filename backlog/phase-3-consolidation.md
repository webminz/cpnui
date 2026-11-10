# Phase 3: Consolidation

## Status: DONE

- [X] Test infrastructure
- [X] double click arc inscription
- [X] zoom re-centre
- [X] palette should be floating


## Test infrastructure 

Now that the first iteration of the editor seems to be stable it is good time to consolidate the application 
and add comprehensive test infrastrucutre. 
Each component and util/libarary function should have it's dedicated unit test, which tests the functionality
thorougly accounting for edge cases, etc.
Moreover, there shall be end-to-end tests using the "playwright" framework for the most common scenarios.

## Double Click Arc inscription

Editing Arcs differs from editing places or transitions:
When double clicking a place or transition we can directly jump into an "in-place" editor since we
are only editing a simple `name`-property.
However, with `arcs`, the label of the arc is an `inscription`, which is a SML expression and therefore 
requires more sophisticated editor support. 
Hence, the "double-click" behaviour has to differ. 
However, we could improve the usability a bit in the sense that double clicking an arc opens the property editor and 
then puts the focus on the `inscpription` textare element so that the user can immediately start to edit.

## Zoom re-centres

When zooming in, currently, the viewport moves to the bottom right instead of centering based on the current midpoint
of the vieport.

## Floating palette 

Currently, the tool palette on the left is not "floating", instead it is a planel, which takes away space from the Canvas.
It would be better, if the palette i a "floating menu" above the Canvas viewport.
