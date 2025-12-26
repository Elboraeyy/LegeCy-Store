'use client';

import { useEffect, useState } from 'react';

interface AdminPermissions {
  role: string | null;
  permissions: string[];
  isLoading: boolean;
}

/**
 * Client hook to check admin permissions.
 * Used for UI-only visibility (backend is source of truth).
 */
export function useAdminPermissions(): AdminPermissions & {
  hasPermission: (permission: string | string[]) => boolean;
  isSuperAdmin: boolean;
} {
  const [state, setState] = useState<AdminPermissions>({
    role: null,
    permissions: [],
    isLoading: true,
  });

  useEffect(() => {
    // Fetch current admin's permissions from session
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          setState({
            role: data.role?.name || null,
            permissions: data.role?.permissions?.split(',').map((p: string) => p.trim()) || [],
            isLoading: false,
          });
        } else {
          setState({ role: null, permissions: [], isLoading: false });
        }
      } catch {
        setState({ role: null, permissions: [], isLoading: false });
      }
    }
    fetchPermissions();
  }, []);

  const isSuperAdmin = state.role === 'super_admin' || state.permissions.includes('ALL');

  const hasPermission = (required: string | string[]): boolean => {
    if (state.isLoading) return false;
    if (isSuperAdmin) return true;

    const requirements = Array.isArray(required) ? required : [required];
    return requirements.some(r => state.permissions.includes(r));
  };

  return {
    ...state,
    hasPermission,
    isSuperAdmin,
  };
}
