import { Injectable, signal, computed } from '@angular/core';

export interface SessionState {
  shiftId: string;
  settlementId: string;
  openingBalance: number;
  isShiftActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly SESSION_KEY = 'pos_session';

  session = signal<SessionState | null>(this.loadSession());
  isShiftActive = computed(() => !!this.session()?.isShiftActive);

  startShift(data: Omit<SessionState, 'isShiftActive'>): void {
    const state: SessionState = { ...data, isShiftActive: true };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(state));
    this.session.set(state);
  }

  endShift(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.session.set(null);
  }

  private loadSession(): SessionState | null {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
