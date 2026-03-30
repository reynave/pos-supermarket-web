import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyIdr', standalone: true })
export class CurrencyIdrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return 'Rp 0';
    return 'Rp ' + Math.round(value).toLocaleString('id-ID');
  }
}
