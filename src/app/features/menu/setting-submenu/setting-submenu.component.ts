import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-setting-submenu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './setting-submenu.component.html',
  styleUrl: './setting-submenu.component.css',
})
export class SettingSubmenuComponent {
  goBack(): void {
    history.back();
  }
}
