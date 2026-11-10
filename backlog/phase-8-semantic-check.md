## Phase 8: Semantic Checks

Due to the decision of following a more leightweight and ad-hoc approach for StandardML expressions of
colored petri nets, rather than implementing complete LSP support, in this phase we need to implement
some semantic checks and additional editor support features in order to approach the originally intended behaviour.

- [x] violation reporting and visualization concept
- [x] places must have an associated colorset
- [x] short notation for single item multiset
- [x] type inference and type checking on arc edges


## Violation and Reporting visualization concept

Befor we can implement semantic violations, we first need a concept for displaying them.
To this end, there should be a hovering "info" button (which may turn red when there are violations).
When clicking this button, a dialog appears showing the current semantic violations.
Ideally, when clicking on a violation, the view and and selection directly jumps to the associated element.
Also, violating elements should have a small visual indicator next to them, indicating that there is an error here somewhere.


## Places must have an associated colorset

Each place **must** jave a color set associated with it. 
Thus, the current text field in the property panel of a place must be exchanged with a dropdown where the user 
selects one of the defined color sets (from the global definitions).
By default, each place may get the default `UNIT` color sets (if it exists).
If that does not exist it is kept empty, which is then a violation.

## Short notation Single element multisets

Instead of writing ```1`x``` one can also use the shorthand notation `x` in standard ML to denote a single item multiset.
Currently, for instance, the editor thinkgs there are `100` elements when writing instead of a single `INT` token with value "100".

## Type inference and type checking on arc edges 

This feature probably can become arbitrary complex.
Hence, we need to go for an incremental approach and develop usability step by step. 
In the first iteration we may check the following:

- Each arc must have a valid expression otherwise it is a violation 
- Technically, the input type of an arc expression must coincide with the colorset type of a "PlaceToTransition"-arc 
and likewise the expression on a "TransitionToPlace"-arc must produce a multiset of elements of the type that coincides with 
the place color set. To check these on arbitrary expression requires full HML-type-checking algorithm, but we could 
approximate it step-wise:
    - we check that every expression is composed valid SML keywords expressions (`case`, `if`), literals (int, string, list)
    or variables and functions (-> we check that the variables and functions are declared in the global definitions)
    - if the arc expression is sufficiently simple, i.e. if it is a "single variable binding" or "desctructuring declaration" (e.g. `(p,i)` for product types)
    we directly check whether the types of the variables and places match
    - we also check guard expressions whether they produce `bool` and variables/functions are defined if they are sufficiently simple


