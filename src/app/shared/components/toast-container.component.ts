import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [ngClass]="{
            'bg-emerald-50 border-emerald-200 text-emerald-700': toast.type === 'success',
            'bg-rose-50 border-rose-200 text-rose-700': toast.type === 'error',
            'bg-blue-50 border-blue-200 text-blue-700': toast.type === 'info',
            'bg-amber-50 border-amber-200 text-amber-700': toast.type === 'warning'
          }"
          class="rounded-xl border shadow-lg px-4 py-3 text-sm font-medium flex items-center gap-2 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
          
          <span class="material-symbols-outlined text-base shrink-0">
            @switch (toast.type) {
              @case ('success') {
                check_circle
              }
              @case ('error') {
                error
              }
              @case ('info') {
                info
              }
              @case ('warning') {
                warning
              }
            }
          </span>
          
          <span class="flex-1">{{ toast.message }}</span>
          
          <button
            type="button"
            (click)="toastService.remove(toast.id)"
            class="text-current opacity-60 hover:opacity-100 transition">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
