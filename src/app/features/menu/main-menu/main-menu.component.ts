import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { environment } from '../../../../environments/environment';

interface MenuModule {
  icon: string;
  title: string;
  description: string;
  route?: string;
  requiresShift: boolean;
  action?: 'logout';
  openInNewTab?: boolean;
}

@Component({
  selector: 'app-main-menu',
  standalone: true,
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.css',
})
export class MainMenuComponent implements OnInit, OnDestroy {
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  currentDate = signal('');
  currentTime = signal('');
  terminalId = environment.terminalId;

  userName = '';
  userRole = '';

  modules: MenuModule[] = [
    { icon: 'shopping_cart', title: 'Cart', description: 'Process customer transactions and payments', route: '/cart', requiresShift: true },
    { icon: 'monitor', title: 'Customer Display', description: 'Customer display for ongoing transactions', route: '/display', requiresShift: true, openInNewTab: true },
    
    { icon: 'add_card', title: 'Manual Cash In', description: 'Manual addition of cash balance in active shift', route: '/manual-cash-in', requiresShift: true },
    { icon: 'event_repeat', title: 'Daily Close', description: 'Close active shift and submit end-of-day summary', route: '/daily-close', requiresShift: true },
    { icon: 'point_of_sale', title: 'Cash Balance', description: 'Manage cash balances and transactions', route: '/cash-balance', requiresShift: false },
    { icon: 'document_search', title: 'Reports', description: 'Shift Report and Daily Close Report', route: '/report-submenu', requiresShift: false },
    { icon: 'tune', title: 'Settings', description: 'Hardware, printers and terminal configuration', route: '/setting-submenu', requiresShift: false },
    { icon: 'logout', title: 'Logout', description: 'Sign out from this terminal', requiresShift: false, action: 'logout' },
  
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';
    this.userRole = user?.role ?? '';
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  navigate(mod: MenuModule): void {
    if (mod.action === 'logout') {
      this.logout();
      return;
    }

    if (!mod.route) return;
    if (mod.requiresShift && !this.sessionService.isShiftActive()) {
      this.router.navigate(['/daily-start']);
      return;
    }

    if (mod.openInNewTab) {
      const url = this.router.serializeUrl(this.router.createUrlTree([mod.route]));
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    this.router.navigate([mod.route]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => this.authService.clearSession(),
    });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentDate.set(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    this.currentTime.set(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  }
}
