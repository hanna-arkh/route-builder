import type { Draft, DraftValidation, RouteSnapshot, SelectedStop, Stop } from '../types/domain';

export function validPackages(stop: Stop, packages: number): boolean {
  return Number.isSafeInteger(packages) && packages >= 1
    && (stop.packagesMax === null || packages <= stop.packagesMax);
}

export function hasUnpairedSurrogate(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

export function validInstructionInput(text: string): boolean {
  return text.length <= 200 && !hasUnpairedSurrogate(text);
}

export function validateDraft(draft: Draft): DraftValidation {
  const errorsByStopId: Record<string, string> = {};
  const ids = new Set<string>();
  let routeError: string | null = draft.selected.length === 0 ? 'Select at least one stop.' : null;
  if (draft.mode === 'one' && draft.selected.length > 1) routeError = 'One stop mode allows only one stop.';
  for (const item of draft.selected) {
    if (!item.stop.id.trim() || ids.has(item.stop.id)) routeError = 'Each selected stop must have a unique ID.';
    ids.add(item.stop.id);
    const error = !validPackages(item.stop, item.packages) ? 'Check the number of packages.'
      : !item.instructions.trim() ? 'Add instructions for this stop before finishing.'
      : !validInstructionInput(item.instructions) ? 'Use at most 200 characters without incomplete emoji.' : null;
    if (error) Object.defineProperty(errorsByStopId, item.stop.id, { value: error, enumerable: true });
  }
  return { valid: routeError === null && Object.keys(errorsByStopId).length === 0, errorsByStopId, routeError };
}

export function createSnapshot(selected: readonly SelectedStop[]): RouteSnapshot {
  return Object.freeze(selected.map(item => Object.freeze({
    stop: Object.freeze({ ...item.stop }), packages: item.packages, instructions: item.instructions,
  })));
}
