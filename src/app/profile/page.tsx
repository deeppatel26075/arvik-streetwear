'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-[10px] font-bold uppercase tracking-widest text-[#666666]">
      Redirecting to account...
    </div>
  );
}
