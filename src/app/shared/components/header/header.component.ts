import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() userName: string = '';
  @Input() showBackButton: boolean = true;

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
