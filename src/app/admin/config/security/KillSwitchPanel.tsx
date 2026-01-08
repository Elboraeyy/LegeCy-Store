'use client';

import { useState, useTransition } from 'react';
import { toggleKillSwitch } from '@/lib/actions/killSwitchActions';
import { KillSwitchKey } from '@/lib/killSwitches';

interface KillSwitchPanelProps {
  initialSwitches: Record<string, boolean>;
}

const SWITCH_CONFIG: Array<{
  key: KillSwitchKey;
  label: string;
  description: string;
  icon: string;
  danger: boolean;
}> = [
  {
    key: 'checkout_enabled',
    label: 'Checkout',
    description: 'Allow customers to complete purchases',
    icon: '🛒',
    danger: true
  },
  {
    key: 'payments_enabled',
    label: 'All Payments',
    description: 'Master switch for all payment processing',
    icon: '💳',
    danger: true
  },
  {
    key: 'paymob_enabled',
    label: 'Paymob (Online Payments)',
    description: 'Credit card and online payment methods',
    icon: '🌐',
    danger: false
  },
  {
    key: 'wallet_enabled',
    label: 'Mobile Wallet',
    description: 'Mobile wallet payment option',
    icon: '📱',
    danger: false
  },
  {
    key: 'cod_enabled',
    label: 'Cash on Delivery',
    description: 'Allow COD payment method',
    icon: '💵',
    danger: false
  },
  {
    key: 'coupons_enabled',
    label: 'Coupons & Discounts',
    description: 'Allow coupon code usage',
    icon: '🎟️',
    danger: false
  },
  {
    key: 'registration_enabled',
    label: 'User Registration',
    description: 'Allow new customer signups',
    icon: '👤',
    danger: false
  },
  {
    key: 'admin_manual_pay',
    label: 'Admin Manual Payment',
    description: 'Allow admins to mark orders as paid manually',
    icon: '⚠️',
    danger: true
  },
  {
    key: 'pos_enabled',
    label: 'POS System',
    description: 'Point of Sale terminal access',
    icon: '🧾',
    danger: false
  }
];

export default function KillSwitchPanel({ initialSwitches }: KillSwitchPanelProps) {
  const [switches, setSwitches] = useState(initialSwitches);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (key: KillSwitchKey, currentValue: boolean) => {
    const newValue = !currentValue;
    setLoading(key);
    
    startTransition(async () => {
      try {
        const result = await toggleKillSwitch(key, newValue);
        if (result.success) {
          setSwitches(result.switches);
        }
      } catch (error) {
        console.error('Failed to toggle switch:', error);
        alert('Failed to toggle switch. Check console for details.');
      } finally {
        setLoading(null);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {SWITCH_CONFIG.map((config) => {
        const isEnabled = switches[config.key] ?? false;
        const isLoading = loading === config.key;
        
        return (
          <div
            key={config.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: config.danger ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-secondary)',
              borderRadius: '12px',
              border: config.danger ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{config.icon}</span>
              <div>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {config.label}
                  {config.danger && (
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444',
                      borderRadius: '4px',
                      fontWeight: 500
                    }}>
                      CRITICAL
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {config.description}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleToggle(config.key, isEnabled)}
              disabled={isLoading || isPending}
              style={{
                position: 'relative',
                width: '60px',
                height: '32px',
                borderRadius: '16px',
                border: 'none',
                cursor: isLoading ? 'wait' : 'pointer',
                backgroundColor: isEnabled ? '#22c55e' : '#94a3b8',
                transition: 'background-color 0.2s',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: isEnabled ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </button>
          </div>
        );
      })}
      
      <div style={{ 
        marginTop: '16px', 
        padding: '16px', 
        backgroundColor: 'rgba(239, 68, 68, 0.05)', 
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#ef4444' }}>
          ⚠️ <strong>Warning:</strong> Disabling critical switches will immediately affect live customers. 
          All changes are logged in the activity log.
        </p>
      </div>
    </div>
  );
}
