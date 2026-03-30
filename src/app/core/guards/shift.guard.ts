import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const shiftGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isShiftActive()) {
    return true;
  }

  router.navigate(['/daily-start']);
  return false;
};
