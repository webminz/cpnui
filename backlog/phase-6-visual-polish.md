# Phase 6: Visual Polishing

- [ ] edge pointer sizes when zooming
- [ ] resize and midpoint handles adjust to zooming 
- [ ] resizable property panel
- [ ] Arc inscriptions as labels


## Edge Pointer Resizing

The motivation for this use case are situations where an imported CPN model was layouted at a smaller zoom-level 
than the default editor zoom-level. In this case, the edge arrowheads are much bigger than the actual elements
and it becomes nearly impossible to recognize or edit anything.
A solution to this issue would be to have arrowhead sizes and line stroke-widths scale according to the zoom level.


## Resize and Midpoint handles resize with Zoom 

As a continuation of the above issue: 
Also resize and midpoint handles have a fixed size, which can be bigger than the actual elements.
In this case it is impossible to actually do anything with tiny elements.
Thus, these handle-"knobs" should also resize in relation to the zoom level.


## Resizable property panel

The textareas in the property panel are currently a bit too small to display all of the SML expressions 
if the latter is long complex.
Hence, the property panel should be resizable.
The current size of the property panel should be stored in _local storage_, i.e. when opening the property panel 
again it should have the user-preferred size.


## Arc inscriptions as labels


An issue that was previously overseen: The arc inscription epxression should be rendered as a readonly label on the respective edge!
To avoid visual clutter, it could be reaonable to "cut" this expression in the label after a certain width or when there are multiple lines,
e.g. shortening with an ellipsis to indicate that there is a shortened expression.

