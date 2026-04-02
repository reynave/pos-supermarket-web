import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-report-submenu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './report-submenu.component.html',
  styleUrl: './report-submenu.component.css',
})
export class ReportSubmenuComponent {
  goBack(): void {
    history.back();
  }
}
