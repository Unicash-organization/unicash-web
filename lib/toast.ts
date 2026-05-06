'use client';

/* -----------------------------------------------------------------------
   Custom toast event bus — replaces SweetAlert2 with a v4-branded
   <ToastProvider> component (mounted at app root). Keeps the same
   `showToast(message, type)` API so all existing call sites work
   without changes.

   How it works:
   1. Pages / components call showToast(message, type, duration?)
   2. This emits an event to all subscribers (the ToastProvider)
   3. ToastProvider adds the event to its toast queue + renders it
----------------------------------------------------------------------- */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (event: ToastEvent) => void;

const listeners = new Set<ToastListener>();

/** Public API — drop-in replacement for the legacy SweetAlert2-based showToast */
export function showToast(message: string, type: ToastType = 'success', duration = 5000) {
  if (typeof window === 'undefined') return;
  const event: ToastEvent = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    message,
    type,
    duration,
  };
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (_) {
      // Subscriber error must not break sender
    }
  });
}

/** Internal — used by <ToastProvider> to subscribe to incoming toasts */
export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
