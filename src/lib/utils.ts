import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

// "Psychology Edition" is the real category name in the database (and
// what filtering/theming key off of), but it's branded as "Hidden
// Patterns" everywhere it's shown to shoppers — including the admin panel,
// so admins aren't picking from a category list that looks different from
// what customers actually see on the site.
export function categoryDisplayName(name: string): string {
  return name.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : name;
}
