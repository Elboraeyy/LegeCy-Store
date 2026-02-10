'use client';

import { useState } from 'react';
import MissionBriefing from './MissionBriefing';
import SecretActions from './SecretActions';
import CommandDeck from './CommandDeck';

interface CommandCenterStats {
    pendingOrders: number;
    activeAlerts: number;
    lowStockCount: number;
    todayRevenue: number;
    systemStatus: 'nominal' | 'attention' | 'critical';
}

interface AdminHomeClientProps {
    stats: CommandCenterStats;
}

import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

export default function AdminHomeClient({ stats }: AdminHomeClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const [vaultOpen, setVaultOpen] = useState(false);
    
    // Time-based greeting REMOVED - using static Welcome for now or we can localize it later
    // const getGreeting = () => ...

    return (
        <>
            {/* Header - Using admin-header class */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.dashboard.welcome}</h1>
                    <p className="admin-subtitle">
                        {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                
                <button 
                    className="admin-btn admin-btn-primary"
                    onClick={() => setVaultOpen(true)}
                    style={{ gap: '10px' }}
                >
                    <span>🔐</span>
                    <span>{t.dashboard.quick_actions}</span>
                </button>
            </div>

            {/* Mission Briefing */}
            <MissionBriefing 
                pendingOrders={stats.pendingOrders}
                activeAlerts={stats.activeAlerts}
                lowStockCount={stats.lowStockCount}
                systemStatus={stats.systemStatus}
            />

            {/* Command Deck */}
            <CommandDeck 
                pendingOrders={stats.pendingOrders}
                todayRevenue={stats.todayRevenue}
                lowStockCount={stats.lowStockCount}
            />

            {/* Secret Actions Vault */}
            <SecretActions 
                isOpen={vaultOpen} 
                onClose={() => setVaultOpen(false)} 
            />
        </>
    );
}
