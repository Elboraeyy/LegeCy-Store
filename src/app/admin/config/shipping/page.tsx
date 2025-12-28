"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, ShippingSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: ShippingSettings = {
    enableShipping: true,
    freeShippingThreshold: 0,
    defaultShippingRate: 50,
    expressShippingRate: 100,
    shippingZones: [
        { name: 'Cairo & Giza', cities: ['Cairo', 'Giza'], rate: 40 },
        { name: 'Alexandria', cities: ['Alexandria'], rate: 50 },
        { name: 'Other Governorates', cities: [], rate: 70 },
    ],
};

export default function ShippingSettingsPage() {
    const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('shipping_settings');
                if (data) setSettings(data as ShippingSettings);
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
            await updateStoreConfig('shipping_settings', settings);
            toast.success('Shipping settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateZone = (index: number, field: string, value: string | number) => {
        const newZones = [...settings.shippingZones];
        newZones[index] = { ...newZones[index], [field]: value };
        setSettings({ ...settings, shippingZones: newZones });
    };

    const addZone = () => {
        setSettings({
            ...settings,
            shippingZones: [
                ...settings.shippingZones,
                { name: 'New Zone', cities: [], rate: 50 },
            ],
        });
    };

    const removeZone = (index: number) => {
        const newZones = settings.shippingZones.filter((_, i) => i !== index);
        setSettings({ ...settings, shippingZones: newZones });
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
                <h1 className="settings-page-title">Shipping</h1>
                <p className="settings-page-description">
                    Configure shipping rates and delivery zones
                </p>
            </div>

            <SettingsSection
                title="Shipping Status"
                description="Enable or disable shipping"
                icon="🚚"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Shipping</div>
                        <div className="settings-toggle-description">
                            Calculate shipping costs at checkout
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableShipping}
                        onChange={(checked) => setSettings({ ...settings, enableShipping: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title="Default Rates"
                description="Standard shipping rates"
                icon="💰"
            >
                <div className="settings-grid settings-grid-3">
                    <SettingsField
                        label="Default Rate (EGP)"
                        htmlFor="defaultRate"
                    >
                        <input
                            id="defaultRate"
                            type="number"
                            value={settings.defaultShippingRate}
                            onChange={(e) => setSettings({ ...settings, defaultShippingRate: Number(e.target.value) })}
                            min={0}
                        />
                    </SettingsField>

                    <SettingsField
                        label="Express Rate (EGP)"
                        htmlFor="expressRate"
                    >
                        <input
                            id="expressRate"
                            type="number"
                            value={settings.expressShippingRate}
                            onChange={(e) => setSettings({ ...settings, expressShippingRate: Number(e.target.value) })}
                            min={0}
                        />
                    </SettingsField>

                    <SettingsField
                        label="Free Shipping Above (EGP)"
                        description="0 = disabled"
                        htmlFor="freeThreshold"
                    >
                        <input
                            id="freeThreshold"
                            type="number"
                            value={settings.freeShippingThreshold}
                            onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                            min={0}
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Shipping Zones"
                description="Define rates by region"
                icon="🗺️"
                action={
                    <button
                        className="admin-btn admin-btn-outline"
                        onClick={addZone}
                        style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                        + Add Zone
                    </button>
                }
            >
                {settings.shippingZones.map((zone, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '20px',
                            background: 'var(--admin-surface-light)',
                            borderRadius: '12px',
                            marginBottom: index < settings.shippingZones.length - 1 ? '16px' : 0,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>Zone {index + 1}</span>
                            {settings.shippingZones.length > 1 && (
                                <button
                                    onClick={() => removeZone(index)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        padding: '4px 12px',
                                        borderRadius: '99px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="settings-grid">
                            <SettingsField
                                label="Zone Name"
                            >
                                <input
                                    type="text"
                                    value={zone.name}
                                    onChange={(e) => updateZone(index, 'name', e.target.value)}
                                    placeholder="e.g., Cairo & Giza"
                                />
                            </SettingsField>

                            <SettingsField
                                label="Rate (EGP)"
                            >
                                <input
                                    type="number"
                                    value={zone.rate}
                                    onChange={(e) => updateZone(index, 'rate', Number(e.target.value))}
                                    min={0}
                                />
                            </SettingsField>
                        </div>
                    </div>
                ))}
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
