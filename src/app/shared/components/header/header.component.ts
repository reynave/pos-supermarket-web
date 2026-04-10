import { Component, Input } from '@angular/core';

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

  goBack(): void {
    history.back();
  }
}
