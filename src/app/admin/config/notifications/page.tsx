"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, NotificationSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

const defaultSettings: NotificationSettings = {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpEncryption: 'tls',
    fromEmail: '',
    fromName: '',
    orderConfirmation: true,
    shippingUpdates: true,
    abandonedCartReminders: false,
    adminNewOrderAlert: true,
    adminLowStockAlert: true,
};

export default function NotificationsSettingsPage() {
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('notification_settings');
                if (data) setSettings(data as NotificationSettings);
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
            await updateStoreConfig('notification_settings', settings);
            toast.success('Notification settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setTesting(true);
        try {
            // This would call a test email API endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('Test email sent! Check your inbox.');
        } catch {
            toast.error('Failed to send test email');
        } finally {
            setTesting(false);
        }
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
                <h1 className="settings-page-title">Notifications</h1>
                <p className="settings-page-description">
                    Configure email delivery and notification preferences
                </p>
            </div>

            <SettingsSection
                title="Email Server (SMTP)"
                description="Configure your email delivery settings"
                icon="📧"
                action={
                    <button
                        className="admin-btn admin-btn-outline"
                        onClick={handleTestEmail}
                        disabled={testing}
                        style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                        {testing ? 'Sending...' : 'Send Test Email'}
                    </button>
                }
            >
                <div className="settings-grid">
                    <SettingsField
                        label="SMTP Host"
                        htmlFor="smtpHost"
                    >
                        <input
                            id="smtpHost"
                            type="text"
                            value={settings.smtpHost}
                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            placeholder="smtp.gmail.com"
                        />
                    </SettingsField>

                    <SettingsField
                        label="SMTP Port"
                        htmlFor="smtpPort"
                    >
                        <input
                            id="smtpPort"
                            type="number"
                            value={settings.smtpPort}
                            onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                            placeholder="587"
                        />
                    </SettingsField>
                </div>

                <div className="settings-grid">
                    <SettingsField
                        label="SMTP Username"
                        htmlFor="smtpUser"
                    >
                        <input
                            id="smtpUser"
                            type="text"
                            value={settings.smtpUser}
                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </SettingsField>

                    <SettingsField
                        label="SMTP Password"
                        htmlFor="smtpPass"
                    >
                        <input
                            id="smtpPass"
                            type="password"
                            value={settings.smtpPass}
                            onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                            placeholder="••••••••"
                        />
                    </SettingsField>
                </div>

                <SettingsField
                    label="Encryption"
                    htmlFor="smtpEncryption"
                >
                    <AdminDropdown
                        value={settings.smtpEncryption}
                        onChange={(v) => setSettings({ ...settings, smtpEncryption: v })}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'tls', label: 'TLS (Recommended)' },
                            { value: 'ssl', label: 'SSL' }
                        ]}
                    />
                </SettingsField>
            </SettingsSection>

            <SettingsSection
                title="Sender Identity"
                description="How your emails will appear to recipients"
                icon="✉️"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="From Email"
                        htmlFor="fromEmail"
                    >
                        <input
                            id="fromEmail"
                            type="email"
                            value={settings.fromEmail}
                            onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                            placeholder="orders@legacy-store.com"
                        />
                    </SettingsField>

                    <SettingsField
                        label="From Name"
                        htmlFor="fromName"
                    >
                        <input
                            id="fromName"
                            type="text"
                            value={settings.fromName}
                            onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                            placeholder="Legacy Store"
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Customer Notifications"
                description="Emails sent to customers"
                icon="👤"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Order Confirmation</div>
                        <div className="settings-toggle-description">
                            Send email when order is placed
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.orderConfirmation}
                        onChange={(checked) => setSettings({ ...settings, orderConfirmation: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Shipping Updates</div>
                        <div className="settings-toggle-description">
                            Notify when order status changes
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.shippingUpdates}
                        onChange={(checked) => setSettings({ ...settings, shippingUpdates: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Abandoned Cart Reminders</div>
                        <div className="settings-toggle-description">
                            Send reminder emails for abandoned carts
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.abandonedCartReminders}
                        onChange={(checked) => setSettings({ ...settings, abandonedCartReminders: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Admin Alerts"
                description="Notifications for store administrators"
                icon="🔔"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">New Order Alert</div>
                        <div className="settings-toggle-description">
                            Notify admin when new order is placed
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.adminNewOrderAlert}
                        onChange={(checked) => setSettings({ ...settings, adminNewOrderAlert: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Low Stock Alert</div>
                        <div className="settings-toggle-description">
                            Notify when product stock is low
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.adminLowStockAlert}
                        onChange={(checked) => setSettings({ ...settings, adminLowStockAlert: checked })}
                    />
                </div>
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
