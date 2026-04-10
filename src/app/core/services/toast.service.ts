import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // ms, default 3000
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(type: 'success' | 'error' | 'info' | 'warning', message: string, duration = 3000) {
    const id = `toast-${++this.nextId}`;
    const toast: Toast = { id, type, message, duration };

    this.toasts.update((t) => [...t, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, duration = 3000) {
    return this.show('success', message, duration);
  }

  error(message: string, duration = 5000) {
    return this.show('error', message, duration);
  }

  info(message: string, duration = 3000) {
    return this.show('info', message, duration);
  }

  warning(message: string, duration = 4000) {
    return this.show('warning', message, duration);
  }

  remove(id: string) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}
