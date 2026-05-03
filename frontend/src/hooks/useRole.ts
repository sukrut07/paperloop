'use client';

import { useEffect, useState } from 'react';
import { getLocalRole, setLocalRole } from '@/lib/localStore';

export type AppRole = 'teacher' | 'recycler' | 'ngo';

export function useRole() {
  const [role, setRoleState] = useState<AppRole>('teacher');

  useEffect(() => {
    setRoleState(getLocalRole() as AppRole);
    const handler = (event: Event) => {
      setRoleState((event as CustomEvent<string>).detail as AppRole);
    };
    window.addEventListener('paperloop-role-change', handler);
    window.addEventListener('storage', () => setRoleState(getLocalRole() as AppRole));
    return () => window.removeEventListener('paperloop-role-change', handler);
  }, []);

  function updateRole(nextRole: AppRole) {
    setLocalRole(nextRole);
    setRoleState(nextRole);
  }

  return { role, setRole: updateRole };
}
