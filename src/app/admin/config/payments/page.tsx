"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, PaymentSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: PaymentSettings = {
    enableCOD: true,
    enablePaymob: false,
    paymobApiKey: '',
    paymobIntegrationId: '',
    enableFawry: false,
    fawryMerchantCode: '',
    fawrySecurityKey: '',
    testMode: true,
    minOrderAmount: 0,
    maxOrderAmount: 0,
};

export default function PaymentsSettingsPage() {
    const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('payment_settings');
                if (data) setSettings(data as PaymentSettings);
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
            await updateStoreConfig('payment_settings', settings);
            toast.success('Payment settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
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
                <h1 className="settings-page-title">Payments</h1>
                <p className="settings-page-description">
                    Configure payment gateways and order limits
                </p>
            </div>

            <SettingsSection
                title="Test Mode"
                description="Enable test mode for development"
                icon="🧪"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Test Mode</div>
                        <div className="settings-toggle-description">
                            Use sandbox/test credentials for all payment gateways
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.testMode}
                        onChange={(checked) => setSettings({ ...settings, testMode: checked })}
                    />
                </div>
                {settings.testMode && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: 'var(--admin-text-on-light)',
                    }}>
                        ⚠️ Test mode is enabled. No real payments will be processed.
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Cash on Delivery (COD)"
                description="Accept cash payments on delivery"
                icon="💵"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Cash on Delivery</div>
                        <div className="settings-toggle-description">
                            Allow customers to pay when order arrives
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableCOD}
                        onChange={(checked) => setSettings({ ...settings, enableCOD: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Paymob"
                description="Accept card payments via Paymob"
                icon="💳"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Paymob</div>
                        <div className="settings-toggle-description">
                            Accept Visa, Mastercard, and more
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enablePaymob}
                        onChange={(checked) => setSettings({ ...settings, enablePaymob: checked })}
                    />
                </div>

                {settings.enablePaymob && (
                    <div style={{ marginTop: '16px' }}>
                        <div className="settings-grid">
                            <SettingsField
                                label="API Key"
                                htmlFor="paymobApiKey"
                            >
                                <input
                                    id="paymobApiKey"
                                    type="password"
                                    value={settings.paymobApiKey}
                                    onChange={(e) => setSettings({ ...settings, paymobApiKey: e.target.value })}
                                    placeholder="pk_live_••••••••"
                                />
                            </SettingsField>

                            <SettingsField
                                label="Integration ID"
                                htmlFor="paymobIntegrationId"
                            >
                                <input
                                    id="paymobIntegrationId"
                                    type="text"
                                    value={settings.paymobIntegrationId}
                                    onChange={(e) => setSettings({ ...settings, paymobIntegrationId: e.target.value })}
                                    placeholder="123456"
                                />
                            </SettingsField>
                        </div>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Fawry"
                description="Accept payments via Fawry"
                icon="🏪"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Fawry</div>
                        <div className="settings-toggle-description">
                            Accept payments at Fawry outlets
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableFawry}
                        onChange={(checked) => setSettings({ ...settings, enableFawry: checked })}
                    />
                </div>

                {settings.enableFawry && (
                    <div style={{ marginTop: '16px' }}>
                        <div className="settings-grid">
                            <SettingsField
                                label="Merchant Code"
                                htmlFor="fawryMerchantCode"
                            >
                                <input
                                    id="fawryMerchantCode"
                                    type="text"
                                    value={settings.fawryMerchantCode}
                                    onChange={(e) => setSettings({ ...settings, fawryMerchantCode: e.target.value })}
                                    placeholder="FawryMerchant123"
                                />
                            </SettingsField>

                            <SettingsField
                                label="Security Key"
                                htmlFor="fawrySecurityKey"
                            >
                                <input
                                    id="fawrySecurityKey"
                                    type="password"
                                    value={settings.fawrySecurityKey}
                                    onChange={(e) => setSettings({ ...settings, fawrySecurityKey: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </SettingsField>
                        </div>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Order Limits"
                description="Set minimum and maximum order amounts"
                icon="📊"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="Minimum Order Amount"
                        description="Leave 0 for no minimum"
                        htmlFor="minOrderAmount"
                    >
                        <input
                            id="minOrderAmount"
                            type="number"
                            value={settings.minOrderAmount}
                            onChange={(e) => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })}
                            placeholder="0"
                            min={0}
                        />
                    </SettingsField>

                    <SettingsField
                        label="Maximum Order Amount"
                        description="Leave 0 for no maximum"
                        htmlFor="maxOrderAmount"
                    >
                        <input
                            id="maxOrderAmount"
                            type="number"
                            value={settings.maxOrderAmount}
                            onChange={(e) => setSettings({ ...settings, maxOrderAmount: Number(e.target.value) })}
                            placeholder="0"
                            min={0}
                        />
                    </SettingsField>
                </div>
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
