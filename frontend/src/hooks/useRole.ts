'use client';

import { useEffect, useState } from 'react';
import { getLocalRole, setLocalRole } from '@/lib/localStore';
import type { Role } from '@/lib/types';

export type AppRole = Role;

export function useRole() {
  const [role, setRoleState] = useState<AppRole>(() => (getLocalRole() === 'teacher' ? 'institution' : getLocalRole()) as AppRole);

  useEffect(() => {
    const handler = (event: Event) => {
      setRoleState((event as CustomEvent<string>).detail as AppRole);
    };
    window.addEventListener('paperloop-role-change', handler);
    window.addEventListener('storage', () => setRoleState((getLocalRole() === 'teacher' ? 'institution' : getLocalRole()) as AppRole));
    return () => window.removeEventListener('paperloop-role-change', handler);
  }, []);

  function updateRole(nextRole: AppRole) {
    setLocalRole(nextRole);
    setRoleState(nextRole);
  }

  return { role, setRole: updateRole };
}
