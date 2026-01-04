'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AdminProfile {
    id: string;
    name: string;
    username: string | null;
    email: string;
    avatar: string | null;
    role: string | null;
}

interface AdminProfileContextType {
    profile: AdminProfile | null;
    loading: boolean;
    csrfToken: string | null;
    refresh: () => Promise<void>;
}

const AdminProfileContext = createContext<AdminProfileContextType>({
    profile: null,
    loading: true,
    csrfToken: null,
    refresh: async () => {}
});

export function useAdminProfile() {
    return useContext(AdminProfileContext);
}

/**
 * Helper hook to get headers with CSRF token for admin API calls
 */
export function useAdminApiHeaders(): HeadersInit {
    const { csrfToken } = useAdminProfile();
    return {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
    };
}

export function AdminProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [csrfToken, setCsrfToken] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            // Fetch profile and CSRF token together
            const [profileRes, csrfRes] = await Promise.all([
                fetch('/api/admin/profile'),
                fetch('/api/admin/csrf')
            ]);
            
            if (profileRes.ok) {
                const data = await profileRes.json();
                setProfile(data);
            }
            
            if (csrfRes.ok) {
                const { token } = await csrfRes.json();
                setCsrfToken(token);
            }
        } catch (error) {
            console.error('Failed to fetch admin profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <AdminProfileContext.Provider value={{ profile, loading, csrfToken, refresh: fetchProfile }}>
            {children}
        </AdminProfileContext.Provider>
    );
}

