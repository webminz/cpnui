export type ViolationSeverity = 'error' | 'warning';

export interface Violation {
  id: string;
  elementId: string;
  elementName: string;
  severity: ViolationSeverity;
  message: string;
}
