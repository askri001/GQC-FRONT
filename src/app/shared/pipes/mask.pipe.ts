import { Pipe, PipeTransform } from '@angular/core';

/**
 * MaskPipe — masks a sensitive string, showing only the last N characters.
 *
 * Usage:
 *   {{ c.cin | mask }}          → ******78   (default: 2 visible)
 *   {{ c.rne | mask:2 }}        → *****45
 *   {{ c.tel | mask:4 }}        → ****5678
 *   {{ null  | mask }}          → -
 *
 * Rules:
 *   - null / undefined / empty  → returns '-'
 *   - value shorter than visible → returns value as-is (nothing to mask)
 *   - otherwise → '*'.repeat(len - visible) + last N chars
 */
@Pipe({
  name: 'mask',
  standalone: true,
  pure: true
})
export class MaskPipe implements PipeTransform {

  transform(value: string | null | undefined, visibleChars: number = 2): string {
    if (!value) return '-';
    if (value.length <= visibleChars) return value;
    return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }
}