"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, MaintenanceSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: MaintenanceSettings = {
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back soon!',
    allowedIPs: [],
    scheduledStart: null,
    scheduledEnd: null,
    redirectUrl: '',
};

export default function MaintenanceSettingsPage() {
    const [settings, setSettings] = useState<MaintenanceSettings>(defaultSettings);
    const [ipInput, setIpInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('maintenance_settings');
                if (data) setSettings(data as MaintenanceSettings);
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('maintenance_settings', settings);
            toast.success('Maintenance settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const addIP = () => {
        if (ipInput && !settings.allowedIPs.includes(ipInput)) {
            setSettings({
                ...settings,
                allowedIPs: [...settings.allowedIPs, ipInput],
            });
            setIpInput('');
        }
    };

    const removeIP = (ip: string) => {
        setSettings({
            ...settings,
            allowedIPs: settings.allowedIPs.filter((i) => i !== ip),
        });
    };

    if (loading) {
        return (
            <div className="settings-loading">
                <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '32px' }} />
                <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} />
            </div>
        );
    }

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Maintenance</h1>
                <p className="settings-page-description">
                    Control store availability and maintenance mode
                </p>
            </div>

            <SettingsSection
                title="Maintenance Mode"
                description="Temporarily disable access to your store"
                icon="🔧"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Maintenance Mode</div>
                        <div className="settings-toggle-description">
                            Visitors will see a maintenance page instead of your store
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enabled}
                        onChange={(checked) => setSettings({ ...settings, enabled: checked })}
                        size="lg"
                    />
                </div>

                {settings.enabled && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'rgba(220, 38, 38, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 600 }}>
                            ⚠️ Maintenance mode is ACTIVE
                        </div>
                        <p style={{ fontSize: '13px', color: '#991b1b', margin: '8px 0 0 0' }}>
                            Your store is not accessible to visitors. Only whitelisted IPs can access.
                        </p>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Maintenance Message"
                description="What visitors will see"
                icon="📝"
            >
                <SettingsField
                    label="Custom Message"
                    htmlFor="message"
                >
                    <textarea
                        id="message"
                        value={settings.message}
                        onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                        placeholder="We are currently performing scheduled maintenance..."
                        rows={4}
                    />
                </SettingsField>

                <SettingsField
                    label="Redirect URL (optional)"
                    description="Redirect visitors to a different page instead of showing maintenance message"
                    htmlFor="redirectUrl"
                >
                    <input
                        id="redirectUrl"
                        type="url"
                        value={settings.redirectUrl}
                        onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
                        placeholder="https://status.yourstore.com"
                    />
                </SettingsField>
            </SettingsSection>

            <SettingsSection
                title="Scheduled Maintenance"
                description="Plan maintenance windows in advance"
                icon="📅"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="Start Date & Time"
                        htmlFor="scheduledStart"
                    >
                        <input
                            id="scheduledStart"
                            type="datetime-local"
                            value={settings.scheduledStart || ''}
                            onChange={(e) => setSettings({ ...settings, scheduledStart: e.target.value || null })}
                        />
                    </SettingsField>

                    <SettingsField
                        label="End Date & Time"
                        htmlFor="scheduledEnd"
                    >
                        <input
                            id="scheduledEnd"
                            type="datetime-local"
                            value={settings.scheduledEnd || ''}
                            onChange={(e) => setSettings({ ...settings, scheduledEnd: e.target.value || null })}
                        />
                    </SettingsField>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                    When scheduled, maintenance mode will automatically activate and deactivate at the specified times.
                </p>
            </SettingsSection>

            <SettingsSection
                title="Allowed IPs"
                description="These IPs can access the store during maintenance"
                icon="🌐"
            >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        placeholder="Enter IP address"
                        style={{
                            flex: 1,
                            maxWidth: '300px',
                            padding: '12px 16px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 'var(--admin-radius-sm)',
                        }}
                    />
                    <button
                        className="admin-btn admin-btn-outline"
                        onClick={addIP}
                        disabled={!ipInput}
                    >
                        Add IP
                    </button>
                </div>

                {settings.allowedIPs.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {settings.allowedIPs.map((ip) => (
                            <span
                                key={ip}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: 'var(--admin-surface-light)',
                                    borderRadius: '99px',
                                    fontSize: '13px',
                                }}
                            >
                                {ip}
                                <button
                                    onClick={() => removeIP(ip)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#dc2626',
                                        fontSize: '16px',
                                        lineHeight: 1,
                                    }}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                        No IPs whitelisted. Add your IP to access during maintenance.
                    </p>
                )}
            </SettingsSection>

            <div className="settings-actions">
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
