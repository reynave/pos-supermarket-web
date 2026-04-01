import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { shiftGuard } from './core/guards/shift.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menu/main-menu/main-menu.component').then((m) => m.MainMenuComponent),
  },
  {
    path: 'daily-start',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/daily-ops/daily-start/daily-start.component').then((m) => m.DailyStartComponent),
  },
  {
    path: 'daily-close',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/daily-ops/daily-close/daily-close.component').then((m) => m.DailyCloseComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard, shiftGuard],
    loadComponent: () =>
      import('./features/register/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'payment',
    canActivate: [authGuard, shiftGuard],
    loadComponent: () =>
      import('./features/register/payment/payment.component').then((m) => m.PaymentComponent),
  },
  {
    path: 'receipt',
    canActivate: [authGuard, shiftGuard],
    loadComponent: () =>
      import('./features/register/receipt/receipt.component').then((m) => m.ReceiptComponent),
  },
  {
    path: 'report',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/report/daily-report/daily-report.component').then((m) => m.DailyReportComponent),
  },
  {
    path: 'display',
    loadComponent: () =>
      import('./features/display/customer-display/customer-display.component').then((m) => m.CustomerDisplayComponent),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
