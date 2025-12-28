"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, SecuritySettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

const defaultSettings: SecuritySettings = {
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableTwoFactor: false,
    adminIpWhitelist: [],
    enableCaptcha: false,
};

export default function SecuritySettingsPage() {
    const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
    const [ipInput, setIpInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('security_settings');
                if (data) setSettings(data as SecuritySettings);
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
            await updateStoreConfig('security_settings', settings);
            toast.success('Security settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const addIP = () => {
        if (ipInput && !settings.adminIpWhitelist.includes(ipInput)) {
            setSettings({
                ...settings,
                adminIpWhitelist: [...settings.adminIpWhitelist, ipInput],
            });
            setIpInput('');
        }
    };

    const removeIP = (ip: string) => {
        setSettings({
            ...settings,
            adminIpWhitelist: settings.adminIpWhitelist.filter((i) => i !== ip),
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
                <h1 className="settings-page-title">Security</h1>
                <p className="settings-page-description">
                    Configure password policies and security measures
                </p>
            </div>

            <SettingsSection
                title="Password Policy"
                description="Requirements for user passwords"
                icon="🔐"
            >
                <SettingsField
                    label="Minimum Password Length"
                    htmlFor="minLength"
                >
                    <AdminDropdown
                        value={settings.minPasswordLength.toString()}
                        onChange={(v) => setSettings({ ...settings, minPasswordLength: Number(v) })}
                        options={[
                            { value: '6', label: '6 characters' },
                            { value: '8', label: '8 characters' },
                            { value: '10', label: '10 characters' },
                            { value: '12', label: '12 characters' }
                        ]}
                    />
                </SettingsField>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Require Uppercase Letters</div>
                        <div className="settings-toggle-description">
                            Password must contain at least one uppercase letter
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.requireUppercase}
                        onChange={(checked) => setSettings({ ...settings, requireUppercase: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Require Numbers</div>
                        <div className="settings-toggle-description">
                            Password must contain at least one number
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.requireNumbers}
                        onChange={(checked) => setSettings({ ...settings, requireNumbers: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Require Special Characters</div>
                        <div className="settings-toggle-description">
                            Password must contain at least one special character (!@#$%^&*)
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.requireSpecialChars}
                        onChange={(checked) => setSettings({ ...settings, requireSpecialChars: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Session & Login"
                description="Control session duration and login attempts"
                icon="⏱️"
            >
                <div className="settings-grid settings-grid-3">
                    <SettingsField
                        label="Session Timeout (minutes)"
                        htmlFor="sessionTimeout"
                    >
                        <input
                            id="sessionTimeout"
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                            min={5}
                            max={1440}
                        />
                    </SettingsField>

                    <SettingsField
                        label="Max Login Attempts"
                        htmlFor="maxAttempts"
                    >
                        <input
                            id="maxAttempts"
                            type="number"
                            value={settings.maxLoginAttempts}
                            onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                            min={1}
                            max={20}
                        />
                    </SettingsField>

                    <SettingsField
                        label="Lockout Duration (minutes)"
                        htmlFor="lockoutDuration"
                    >
                        <input
                            id="lockoutDuration"
                            type="number"
                            value={settings.lockoutDuration}
                            onChange={(e) => setSettings({ ...settings, lockoutDuration: Number(e.target.value) })}
                            min={1}
                            max={1440}
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Additional Security"
                description="Extra security measures"
                icon="🛡️"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Two-Factor Authentication</div>
                        <div className="settings-toggle-description">
                            Require 2FA for admin accounts
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableTwoFactor}
                        onChange={(checked) => setSettings({ ...settings, enableTwoFactor: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable CAPTCHA</div>
                        <div className="settings-toggle-description">
                            Show CAPTCHA on login and registration forms
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableCaptcha}
                        onChange={(checked) => setSettings({ ...settings, enableCaptcha: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Admin IP Whitelist"
                description="Restrict admin access to specific IP addresses"
                icon="🌐"
            >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        placeholder="192.168.1.1"
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

                {settings.adminIpWhitelist.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {settings.adminIpWhitelist.map((ip) => (
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
                        No IPs whitelisted. All IPs can access admin.
                    </p>
                )}
            </SettingsSection>

            <div className="settings-actions">
                <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => {
                        setSettings(defaultSettings);
                        toast.info('Settings reset to default values');
                    }}
                    type="button"
                >
                    Reset to Default
                </button>
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
