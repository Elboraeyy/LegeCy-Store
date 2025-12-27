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
    refresh: () => Promise<void>;
}

const AdminProfileContext = createContext<AdminProfileContextType>({
    profile: null,
    loading: true,
    refresh: async () => {}
});

export function useAdminProfile() {
    return useContext(AdminProfileContext);
}

export function AdminProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/admin/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
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
        <AdminProfileContext.Provider value={{ profile, loading, refresh: fetchProfile }}>
            {children}
        </AdminProfileContext.Provider>
    );
}
