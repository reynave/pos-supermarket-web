import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { environment } from '../../../../environments/environment';

interface MenuModule {
  icon: string;
  title: string;
  description: string;
  route: string;
  requiresShift: boolean;
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
    { icon: 'point_of_sale', title: 'Cash Balance', description: 'Manage cash balances and transactions', route: '/cash-balance', requiresShift: false },
    { icon: 'user_attributes', title: 'Shift Reports', description: 'View daily summaries and cash out reports', route: '/report', requiresShift: false },
    { icon: 'event_repeat', title: 'Daily Close Report', description: 'View daily close reports and summaries', route: '', requiresShift: false },
    { icon: 'tune', title: 'Settings', description: 'Hardware, printers and terminal configuration', route: '', requiresShift: false },
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
    if (!mod.route) return;
    if (mod.requiresShift && !this.sessionService.isShiftActive()) {
      this.router.navigate(['/daily-start']);
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
