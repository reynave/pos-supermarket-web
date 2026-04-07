import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-printer-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './printer-setup.component.html',
  styleUrl: './printer-setup.component.css',
})
export class PrinterSetupComponent {
  goBack(): void {
    history.back();
  }
}
