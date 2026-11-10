# Phase 9: More visual features


- [x] Element Focus
- [x] guard labels, color set name label, duration label and inscription label most be movable too
- [x] "cheatsheet" mode
    - [x] coordinate reporting
    - [x] shortcuts for top panel commands
- [x] better grid lines
- [x] smaller visual improvements
    - [x] tokens visualized with slightly bigger dots and more space between them
    - [x] icons
    - [x] placement of "semanitc issues" button
- [x] export graphics as SVG and PNG


## Element Focus

Focusing of elements could be slightly improved: For instance, once a place or transition is selected
and thus the property panel opens, the selection focus should be on the first field in the property panel
such that one may edit the properties right away, also, tab and shift-tab can be used to cycle the property
widgets.
When pressing escape while an element is selected, the selection and the property window shall disappear.
Also, when pressing escape in "panning mode", it shall go back to default, i.e. "selection mode".

## Movable Labels

Currently, the labels for transition/place names and arc inscriptions are movable.
The labels repsenting the "place color", "the transition guard", "the initial place marking", and the "transition duration"
are **not movable** right now, this should be fixed such that they can be moved in the same way as the name label.
The positioning of this extra labels must be presisted an retained when storing/loading the net to/from file.

## Cheatsheet mode

There shall be a new "cheatsheet" mode.
This mode is active while the user is keeping the "?" key pressed and is meant to show
the exact coordinates of all visual elements as well as common shortcuts.
In this mode, the graphical editor should show the location of the (0,0) point as well as the x and y coordinates
of every top-left corner (for transitions) or centre (for places) respectively, in addition to width and height of each
element.
Also, the mode shall show the keyboard shortcuts for every major function in the top panel:

- Ctl/Cmd-Z: undo
- Ctl/Cmd-Y: redo
- G: edit globals
- Ctl/Cmd-S: Save/Export file
- Ctl/Cmd-L: Load File
- Ctl/Cmd-N: New Net
- I: show global issues

Missing Shortcuts must be registered if not already presenet.

## Better grid lines

Currently, the "grid" is just a matrix of dots placed in a fixed distance to each other.
I would rather like to have a "real" grid comprsising of lines.
This grid should respect to zooming, e.g. when zooming, thinner grid lines for the next lower scale shall appear.
Vice versa for zooming out.
The spacing between the scales must be chosen as a reasonable default.

## Smaller Visual improvements

- The positioning of the "issues button" is not ideal as it blocks the positioning buttons on the bottom-right.
Maybe a better placement would be on the top right.
- The block dots representing tokens are a bit too small, they could be a bit bigger, but the spacing between them could be increased
- There could be an increased use of icons (e.g. using https://iconify.design), e.g. for the save, load, and other buttons. The
duration label could have a small "timeglass" icon next to it to distinguish it from the others, while the colorset could have a "color icon"


## Export Graphics functionality

Finally, it would be nice to have an "export as SVG" and a "export as PNG" button to export only the graphic itself.
