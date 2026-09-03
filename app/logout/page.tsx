'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('impactbridge_authenticated');
      localStorage.removeItem('impactbridge_user_email');
      localStorage.removeItem('impactbridge_user_name');
      localStorage.removeItem('impactbridge_auth_token');
      router.replace('/auth');
    };
    logout();
  }, [router]);

  return <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Logging out...</main>;
}
