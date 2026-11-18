'use server';

import { revalidatePath } from 'next/cache';

// Storefront pages (home, shop, product pages) are cached with ISR so
// shoppers get an instant response instead of waiting on Supabase every
// visit. Admin screens call this after any catalog / hero change so the
// edit shows up on the live site immediately rather than after the
// revalidate window runs out.
export async function refreshStorefront() {
  revalidatePath('/', 'layout');
}
