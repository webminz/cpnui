# Coloured Petri Net Editor

## Product Vision

The goal is to develop a web-based graphical editor for _coloured petri nets (CPNs)_. 
The latter are an extension of regular petri nets invented by Kurt Jensen at the University of Århus.
CPNs allow to write (alomost) arbitrary StandardML expressions on arcs and regular tokens are replaced by "multiset of
StandardML terms". Each place has a colour, i.e. StandardML datatype and transitions can be fired when every incoming arc 
variable binding can be bound. There exists an old Desktop GUI but the latter is only runnable under Windows.
Hence, it is desired to have a modern web-based user-interface for it.

## Features 

The tool should have the following features:

- Web-based graphical editor with modern ergonomics (e.g. keyboard shortcuts) and look-and-feel, Elements (Places, Transitions, and Arc)
can be placed from a palette window onto a zoomable, pannable canvas (incl. usability features: grid lines, snap to grid, auto-layout)
- The tool should be able to export and import CPN models conforming to the Petri Net Markup language format (https://www.pnml.org/).
- The tool should have an ergonomic text-based editor for editing guard and arc inscriptions, i.e. StandardML expressions. There 
should be full editor support, e.g. using a language server

## Technical details

- The tools shall be developed TypeScript with Angular and have a well-defined component structure.
- Everything shall happen client-side (i.e. state is also stored client-side), the only server component that is needed is a webserver for serving static content 
- The drawing should use standard SVG functionality. A library might be used if deemed necessary
