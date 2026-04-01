import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ConnectionTestResult,
  PrinterType,
  StartupConfig,
  StartupConfigService,
} from '../../core/services/startup-config.service';

@Component({
  selector: 'app-startup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './startup.component.html',
  styleUrl: './startup.component.css',
})
export class StartupComponent {
  config = signal<StartupConfig>(this.startupConfigService.loadConfig());
  testing = signal(false);
  saving = signal(false);
  testResult = signal<ConnectionTestResult | null>(null);

  printerTypes: PrinterType[] = ['LAN', 'SERIAL', 'COM'];

  isLan = computed(() => this.config().printerType === 'LAN');
  isSerialOrCom = computed(() => this.config().printerType === 'SERIAL' || this.config().printerType === 'COM');

  constructor(
    private router: Router,
    private startupConfigService: StartupConfigService,
  ) {}

  updateField<K extends keyof StartupConfig>(key: K, value: StartupConfig[K]): void {
    this.config.update((current) => ({ ...current, [key]: value }));
  }

  onTestConnection(): void {
    this.testing.set(true);
    this.testResult.set(null);
    this.startupConfigService.testConnection(this.config()).subscribe((result) => {
      this.testing.set(false);
      this.testResult.set(result);
    });
  }

  onSaveAndConnect(): void {
    this.saving.set(true);
    this.startupConfigService.saveConfig(this.config());
    this.saving.set(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
