import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { shiftGuard } from './core/guards/shift.guard';

export const routes: Routes = [
  {
    path: 'startup',
    loadComponent: () =>
      import('./features/startup/startup.component').then((m) => m.StartupComponent),
  },
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
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menu/main-menu/main-menu.component').then((m) => m.MainMenuComponent),
  },
  {
    path: 'report-submenu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menu/report-submenu/report-submenu.component').then((m) => m.ReportSubmenuComponent),
  },
  {
    path: 'setting-submenu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menu/setting-submenu/setting-submenu.component').then((m) => m.SettingSubmenuComponent),
  },
  {
    path: 'settings/payment-type',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/payment-type-settings/payment-type-settings.component').then((m) => m.PaymentTypeSettingsComponent),
  },
  {
    path: 'settings/payment-type/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/payment-type-detail/payment-type-detail.component').then((m) => m.PaymentTypeDetailComponent),
  },
  {
    path: 'settings/erc-qr',
    redirectTo: 'settings/payment-type',
    pathMatch: 'full',
  },
  {
    path: 'settings/printer-setup',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/printer-setup/printer-setup.component').then((m) => m.PrinterSetupComponent),
  },
  {
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/items-list/items-list.component').then((m) => m.ItemsListComponent),
  },
  {
    path: 'items/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-form/item-form.component').then((m) => m.ItemFormComponent),
  },
  {
    path: 'items/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-form/item-form.component').then((m) => m.ItemFormComponent),
  },
  {
    path: 'items/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/items/item-detail/item-detail.component').then((m) => m.ItemDetailComponent),
  },
  {
    path: 'daily-start',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/daily-ops/daily-start/daily-start.component').then((m) => m.DailyStartComponent),
  },
  {
    path: 'manual-cash-in',
    canActivate: [authGuard, shiftGuard],
    loadComponent: () =>
      import('./features/daily-ops/manual-cash-in/manual-cash-in.component').then((m) => m.ManualCashInComponent),
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
    path: 'daily-close-history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/report/daily-close-history/daily-close-history.component').then((m) => m.DailyCloseHistoryComponent),
  },
  {
    path: 'cash-balance',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/report/cash-balance/cash-balance.component').then((m) => m.CashBalanceComponent),
  },
  {
    path: 'display',
    loadComponent: () =>
      import('./features/display/customer-display/customer-display.component').then((m) => m.CustomerDisplayComponent),
  },
  { path: '', redirectTo: '/startup', pathMatch: 'full' },
  { path: '**', redirectTo: '/startup' },
];
