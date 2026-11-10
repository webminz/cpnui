# Phase 5: Basic Im-/Export — DONE

In this phase, it is about time to implement  basic _import_ and _export_ functionality.
The serialization format, we are using here, is the XML-based "CPN-format" (file ending `.cpn`),
which is defined in `../definitions/cpn.dtd`.
This format is a more simple than the more comprehensive PNML format and is used by the existing `CPNtools` (https://cpntools.org/).
This will be a good checkpoint and use case to validate the utility of the editor.
There are three example cpn models in `../samples/`.
The tool should be able to load these into the editor, visualize them correcectly, allow some small edits, and be able to export them again in the same format
(potential system/end-to-end test case here).

## Implementation Summary

- **CPN XML Parser** (`src/app/cpn/cpn-import.ts`): `parseCpnXml()` parses CPN Tools XML into the internal `CpnNet` model using `DOMParser`. Handles places, transitions, arcs (PtoT/TtoP direction), bend points (sorted by serial), colour sets, declarations, and graphics attributes. Y-axis is negated (CPN Tools uses Y-up, SVG uses Y-down).
- **CPN XML Serializer** (`src/app/cpn/cpn-export.ts`): `serializeCpnXml()` converts `CpnNet` back to CPN Tools XML format. Properly escapes XML special characters and negates Y coordinates back.
- **NetStoreService**: Added `loadNet()` method for loading imported nets with history snapshot.
- **Toolbar UI**: Added New/Open/Save buttons. Open uses a hidden file input; Save triggers a browser download.
- **Unit Tests**: 11 import tests + 8 export tests covering parsing, direction logic, bend points, graphics, colour sets, round-trip, and error handling.
- **E2E Tests**: 4 Playwright tests for import/export workflow including ResourceAllocation.cpn with bend points.

