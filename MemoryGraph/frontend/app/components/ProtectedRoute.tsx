'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect } from 'react';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (pathname.startsWith('/auth/')) return;
    router.replace(loginPathWithNext(pathname));
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f0df]">
        <p className="text-sm font-medium text-slate-600">{LOADING_APP}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
