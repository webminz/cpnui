import { computed, inject, Injectable } from '@angular/core';
import { Violation } from '../core/model/violation';
import { Arc, Place, Transition } from '../core/model/cpn-net';
import { NetStoreService } from './net-store.service';
import {
  extractIdentifiers,
  isSimpleVariable,
  isDestructuringPattern,
  extractDestructuredNames,
  parseVariableDeclarations,
  parseFunctionNames,
  resolveColourSet,
} from '../core/sml-analyzer';

let violationCounter = 0;
function nextViolationId(): string {
  return `v-${++violationCounter}`;
}

@Injectable({ providedIn: 'root' })
export class ViolationService {
  private readonly netStore = inject(NetStoreService);

  readonly violations = computed<Violation[]>(() => {
    const net = this.netStore.net();
    const page = net.pages[0];
    const colourSets = net.colourSets;
    const csNames = new Set(colourSets.map((cs) => cs.name).filter(Boolean));
    const declaredVars = parseVariableDeclarations(net.declarations);
    const declaredFunNames = parseFunctionNames(net.declarations);
    const varNames = new Set(declaredVars.map((v) => v.name));
    const funNames = new Set(declaredFunNames);
    // Enum values from colour sets
    const enumValues = new Set<string>();
    for (const cs of colourSets) {
      const m = cs.declaration.match(/^colset\s+\w+\s*=\s*with\s+(.*)/);
      if (m) {
        m[1].replace(/;$/, '').split('|').map((s) => s.trim()).filter(Boolean).forEach((v) => enumValues.add(v));
      }
    }

    const knownNames = new Set([...csNames, ...varNames, ...funNames, ...enumValues]);

    const violations: Violation[] = [];

    for (const place of page.places) {
      this.checkPlace(place, csNames, knownNames, violations);
    }
    for (const transition of page.transitions) {
      this.checkTransition(transition, knownNames, violations);
    }
    for (const arc of page.arcs) {
      this.checkArc(arc, page.places, page.transitions, colourSets, csNames, knownNames, declaredVars, violations);
    }

    return violations;
  });

  readonly violationCount = computed(() => this.violations().length);
  readonly errorCount = computed(() => this.violations().filter((v) => v.severity === 'error').length);
  readonly hasErrors = computed(() => this.errorCount() > 0);

  /** Get violations for a specific element */
  violationsForElement(elementId: string): Violation[] {
    return this.violations().filter((v) => v.elementId === elementId);
  }

  /** Computed: set of element IDs that have violations */
  readonly violatingElementIds = computed<Set<string>>(() => {
    const ids = new Set<string>();
    for (const v of this.violations()) {
      ids.add(v.elementId);
    }
    return ids;
  });

  private checkPlace(
    place: Place,
    csNames: Set<string>,
    knownNames: Set<string>,
    violations: Violation[],
  ): void {
    // Places must have a colour set
    if (!place.colourSetId) {
      violations.push({
        id: nextViolationId(),
        elementId: place.id,
        elementName: place.name,
        severity: 'error',
        message: `Place "${place.name}" has no colour set assigned.`,
      });
    } else if (!csNames.has(place.colourSetId)) {
      violations.push({
        id: nextViolationId(),
        elementId: place.id,
        elementName: place.name,
        severity: 'error',
        message: `Place "${place.name}" references undefined colour set "${place.colourSetId}".`,
      });
    }

    // Check initial marking references
    const markingText = place.initialMarking.text.trim();
    if (markingText) {
      const ids = extractIdentifiers(markingText);
      for (const name of ids) {
        if (!knownNames.has(name)) {
          violations.push({
            id: nextViolationId(),
            elementId: place.id,
            elementName: place.name,
            severity: 'warning',
            message: `Initial marking of "${place.name}" references undefined name "${name}".`,
          });
        }
      }
    }
  }

  private checkTransition(
    transition: Transition,
    knownNames: Set<string>,
    violations: Violation[],
  ): void {
    // Check guard references
    const guardText = transition.guard.text.trim();
    if (guardText) {
      const ids = extractIdentifiers(guardText);
      for (const name of ids) {
        if (!knownNames.has(name)) {
          violations.push({
            id: nextViolationId(),
            elementId: transition.id,
            elementName: transition.name,
            severity: 'warning',
            message: `Guard of "${transition.name}" references undefined name "${name}".`,
          });
        }
      }
    }
  }

  private checkArc(
    arc: Arc,
    places: Place[],
    transitions: Transition[],
    colourSets: import('../core/model/cpn-net').ColourSet[],
    csNames: Set<string>,
    knownNames: Set<string>,
    declaredVars: { name: string; colourSetName: string }[],
    violations: Violation[],
  ): void {
    const inscText = arc.inscription.text.trim();

    // Determine the connected place
    const sourcePlace = places.find((p) => p.id === arc.sourceId);
    const targetPlace = places.find((p) => p.id === arc.targetId);
    const place = sourcePlace ?? targetPlace;
    const arcLabel = this.arcLabel(arc, places, transitions);

    // Arc must have an inscription
    if (!inscText) {
      violations.push({
        id: nextViolationId(),
        elementId: arc.id,
        elementName: arcLabel,
        severity: 'warning',
        message: `Arc ${arcLabel} has no inscription.`,
      });
      return;
    }

    // Check identifier references
    const ids = extractIdentifiers(inscText);
    for (const name of ids) {
      if (!knownNames.has(name)) {
        violations.push({
          id: nextViolationId(),
          elementId: arc.id,
          elementName: arcLabel,
          severity: 'warning',
          message: `Inscription of arc ${arcLabel} references undefined name "${name}".`,
        });
      }
    }

    // Type checking for simple cases
    if (place?.colourSetId && csNames.has(place.colourSetId)) {
      const placeCs = colourSets.find((cs) => cs.name === place.colourSetId);
      if (placeCs) {
        const resolved = resolveColourSet(placeCs, colourSets);
        this.checkArcTypeCompatibility(
          arc, inscText, place, resolved, declaredVars, colourSets, violations, arcLabel,
        );
      }
    }
  }

  private checkArcTypeCompatibility(
    arc: Arc,
    inscText: string,
    place: Place,
    resolvedCs: import('../core/sml-analyzer').ResolvedColourSet,
    declaredVars: { name: string; colourSetName: string }[],
    colourSets: import('../core/model/cpn-net').ColourSet[],
    violations: Violation[],
    arcLabel: string,
  ): void {
    // Strip multiset notation to get the value expression
    // Handle "N`expr" and "expr1 ++ expr2" by checking each part
    const parts = inscText.split('++');
    for (const part of parts) {
      const p = part.trim();
      // Extract value part (after optional coefficient)
      const coeffMatch = p.match(/^\d+`(.+)$/);
      const valueExpr = coeffMatch ? coeffMatch[1].trim() : p;

      // Simple variable binding
      if (isSimpleVariable(valueExpr)) {
        const varName = valueExpr.trim();
        const decl = declaredVars.find((v) => v.name === varName);
        if (decl && place.colourSetId && decl.colourSetName !== place.colourSetId) {
          // Check if the variable's colour set resolves to the same base type
          const varCs = colourSets.find((cs) => cs.name === decl.colourSetName);
          const placeCs = colourSets.find((cs) => cs.name === place.colourSetId);
          if (varCs && placeCs) {
            const varResolved = resolveColourSet(varCs, colourSets);
            const placeResolved = resolveColourSet(placeCs, colourSets);
            if (varResolved.baseType !== 'unknown' && placeResolved.baseType !== 'unknown' &&
                varResolved.baseType !== placeResolved.baseType) {
              violations.push({
                id: nextViolationId(),
                elementId: arc.id,
                elementName: arcLabel,
                severity: 'error',
                message: `Type mismatch on arc ${arcLabel}: variable "${varName}" has type ${decl.colourSetName} but place "${place.name}" expects ${place.colourSetId}.`,
              });
            }
          }
        }
      }

      // Destructuring pattern like (x, y)
      if (isDestructuringPattern(valueExpr) && resolvedCs.baseType === 'product' && resolvedCs.components) {
        const names = extractDestructuredNames(valueExpr);
        if (names.length !== resolvedCs.components.length) {
          violations.push({
            id: nextViolationId(),
            elementId: arc.id,
            elementName: arcLabel,
            severity: 'error',
            message: `Destructuring on arc ${arcLabel} has ${names.length} components but colour set "${place.colourSetId}" expects ${resolvedCs.components.length}.`,
          });
        } else {
          // Check each component variable's type
          for (let i = 0; i < names.length; i++) {
            const varName = names[i];
            const expectedCs = resolvedCs.components[i];
            const decl = declaredVars.find((v) => v.name === varName);
            if (decl && decl.colourSetName !== expectedCs) {
              violations.push({
                id: nextViolationId(),
                elementId: arc.id,
                elementName: arcLabel,
                severity: 'error',
                message: `Type mismatch on arc ${arcLabel}: component "${varName}" has type ${decl.colourSetName} but position ${i + 1} of "${place.colourSetId}" expects ${expectedCs}.`,
              });
            }
          }
        }
      }
    }
  }

  private arcLabel(arc: Arc, places: Place[], transitions: Transition[]): string {
    const source: Place | Transition | undefined =
      places.find((p) => p.id === arc.sourceId) ?? transitions.find((t) => t.id === arc.sourceId);
    const target: Place | Transition | undefined =
      places.find((p) => p.id === arc.targetId) ?? transitions.find((t) => t.id === arc.targetId);
    const sourceName = source?.name ?? '?';
    const targetName = target?.name ?? '?';
    return `${sourceName} -> ${targetName}`;
  }
}
