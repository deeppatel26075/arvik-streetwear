import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tquoyphmzpsuiwnchctg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdW95cGhtenBzdWl3bmNoY3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjY2NTQsImV4cCI6MjA5NzI0MjY1NH0.4jgW1wQ1HiTJ3PSlmwSAqUP-GIV8aDYVok-ffyXt_OY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function withTimeout<T>(promise: PromiseLike<T> | Promise<T> | any, timeoutMs = 1000): Promise<T | null> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve(promise).then((res) => {
        clearTimeout(timeoutId);
        return res;
      }),
      timeoutPromise,
    ]);
  } catch (err) {
    clearTimeout(timeoutId!);
    return null;
  }
}
