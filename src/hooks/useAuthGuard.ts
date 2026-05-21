'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/auth';

export function useAuthGuard(requiredRole?: UserRole | UserRole[]) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole;

      if (!allowed) {
        router.replace('/');
      }
    }
  }, [user, router, requiredRole]);

  return { user, isReady: !!user };
}
