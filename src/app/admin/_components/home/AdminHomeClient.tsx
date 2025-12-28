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

export default function AdminHomeClient({ stats }: AdminHomeClientProps) {
    const [vaultOpen, setVaultOpen] = useState(false);
    
    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <>
            {/* Header - Using admin-header class */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{getGreeting()}, Commander</h1>
                    <p className="admin-subtitle">
                        {new Date().toLocaleDateString('en-US', { 
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
                    <span>The Vault</span>
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
