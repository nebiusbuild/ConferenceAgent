// Global abort registry for agent operations
// Maps operation type to AbortController so running operations can be cancelled

const activeOperations = new Map<string, AbortController>();

export function startOperation(type: string): AbortSignal {
  // Cancel any existing operation of the same type
  cancelOperation(type);
  const controller = new AbortController();
  activeOperations.set(type, controller);
  return controller.signal;
}

export function cancelOperation(type: string): boolean {
  const controller = activeOperations.get(type);
  if (controller) {
    controller.abort();
    activeOperations.delete(type);
    return true;
  }
  return false;
}

export function finishOperation(type: string): void {
  activeOperations.delete(type);
}

export function getActiveOperations(): string[] {
  return Array.from(activeOperations.keys());
}
