import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyIdr', standalone: true })
export class CurrencyIdrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0';
    return '' + Math.round(value).toLocaleString('id-ID');
  }
}
