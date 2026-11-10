# Phase 2: Properties & Polish

## Status Overview: DONE

- [X] Property panel for editing place/transition/arc attributes
- [X] Inline name editing (double-click)
- [X] Undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- [X] Multi-select (rubber band + Shift-click)
- [X] Ghost elements
- [X] QoL improvements


## Property panel

When selecting an element (node, place, or arc), a "floating" property panel should open at the top-right (maybe with a quick smoth CSS animation).
This panel allows to edit all semantic properties of the elements. That is:

- the `name` of the element (applies to all)
- the `colorset` of a place (applies to places only)
- the `guard` expression (applies to transitions only)
- the `duration` expression (applies to transitions only)
- the `inscription` expression (applies to arc only)
- the `inital marking` expression (applies to places only)

Right now, we have not yet implemented SML editor support and semantic checks. 
Hence, the above inputs are to be approximated with "normal" input elements (`input-text`, `textarea`, `select-dropdown`)


## Inline rename

When double-clicking an element in selection mode it should directly change to a leightweight "in-place"
label editor to only change the name of the element, i.e. hopping over the property panel.


## Multi-select 

When pressing down the mouse button and holding it pressed, a graphical "lasso"-select should appear that 
allows to select multiple elements at once.
The multi-selection can be used to move multiple elements around on the Canvas simulataneosly.
When selecting multiple elements, there shall not be a property box.
There should also be a function for incremental selection, i.e. when holding down the "Shift"-key and selecting a previously
unselected element, it should be added to the selection. Vice versa, selecting a previously selected element again while
holding the "Shift" key removes it from the selection.

## Undo/Redo

The editor shall support Undo/Redo for placement, movement and property-edit operations. 
The respectives history lengths should be fixed but configurable via a constant in the program code.
Undo/Redo can be triggered either via <Ctrl-C/Ctrl-Z> (Windows/Linux) and <Cmd-C/Cmd-Z> (Mac os).
Alternatively, there are "back" and "forwards" buttons on the top-panel.



## Ghost Elements

While in placement mode (for places and transitions),
a "ghost" place/transition should appear under the cursor to indicate the future placement of the element. 


## Small QoL improvementns

Visually divide the "tool palette" into _movement_ and _placement_ tools.
Pressing `Esc` when in placement or arc-connection mode goes back to selection mode.
In the bottom right, there should be four "arrow"-key buttons to move the viewport around as well as 
small "+" and "-" buttons for zooming (similar user experience like in Google maps).
