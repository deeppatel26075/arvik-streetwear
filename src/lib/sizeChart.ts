// Garment measurements for ARVIIK's oversized tees, in inches.
// Single source for the product page's Size Guide pop-up and /size-guide,
// so the two can never show different numbers.

export interface SizeRow {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  chest: number;
  length: number;
  shoulder: number;
}

export const SIZE_CHART: SizeRow[] = [
  { size: 'S', chest: 42, length: 28, shoulder: 21 },
  { size: 'M', chest: 44, length: 29, shoulder: 22 },
  { size: 'L', chest: 46, length: 30, shoulder: 23 },
  { size: 'XL', chest: 48, length: 31, shoulder: 24 },
  { size: 'XXL', chest: 50, length: 32, shoulder: 25 },
];

export const inchesToCm = (inches: number) => Math.round(inches * 2.54);

/**
 * Size suggestion from body weight, used by the product page "Find Size"
 * tool and by Aris. Oversized is the house fit; "regular" sizes down one.
 */
export function recommendSize(weightKg: number, fit: 'oversized' | 'regular' = 'oversized'): SizeRow['size'] {
  let size: SizeRow['size'];
  if (weightKg < 58) size = 'S';
  else if (weightKg < 72) size = 'M';
  else if (weightKg < 84) size = 'L';
  else if (weightKg < 96) size = 'XL';
  else size = 'XXL';

  if (fit === 'regular' && size !== 'S') {
    const down: Record<string, SizeRow['size']> = { M: 'S', L: 'M', XL: 'L', XXL: 'XL' };
    size = down[size];
  }
  return size;
}
