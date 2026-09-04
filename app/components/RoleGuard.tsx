'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Role = 'CSR' | 'NGO';

export default function RoleGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem('impactbridge_authenticated') === 'true';
    const role = localStorage.getItem('impactbridge_user_role') as Role | null;

    if (!authenticated || (role !== 'CSR' && role !== 'NGO')) {
      if (pathname !== '/auth') router.replace('/auth');
      setChecked(true);
      return;
    }

    // The root dashboard is CSR-only. NGO partners belong in the tender workspace.
    if (pathname === '/' && role === 'NGO') {
      router.replace('/tenders');
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked && pathname !== '/auth') return null;
  return null;
}
