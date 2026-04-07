import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-erc-qr-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './erc-qr-settings.component.html',
  styleUrl: './erc-qr-settings.component.css',
})
export class ErcQrSettingsComponent {
  goBack(): void {
    history.back();
  }
}
