"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, TaxSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: TaxSettings = {
    enableTaxes: false,
    defaultTaxRate: 14,
    pricesIncludeTax: true,
    displayTaxInCart: true,
    taxRegions: [
        { name: 'Egypt (VAT)', rate: 14 },
    ],
};

export default function TaxesSettingsPage() {
    const [settings, setSettings] = useState<TaxSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('tax_settings');
                if (data) setSettings(data as TaxSettings);
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
            await updateStoreConfig('tax_settings', settings);
            toast.success('Tax settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateRegion = (index: number, field: string, value: string | number) => {
        const newRegions = [...settings.taxRegions];
        newRegions[index] = { ...newRegions[index], [field]: value };
        setSettings({ ...settings, taxRegions: newRegions });
    };

    const addRegion = () => {
        setSettings({
            ...settings,
            taxRegions: [
                ...settings.taxRegions,
                { name: 'New Region', rate: 0 },
            ],
        });
    };

    const removeRegion = (index: number) => {
        const newRegions = settings.taxRegions.filter((_, i) => i !== index);
        setSettings({ ...settings, taxRegions: newRegions });
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
                <h1 className="settings-page-title">Taxes</h1>
                <p className="settings-page-description">
                    Configure tax rates and calculation settings
                </p>
            </div>

            <SettingsSection
                title="Tax Settings"
                description="Enable and configure tax collection"
                icon="💰"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Enable Taxes</div>
                        <div className="settings-toggle-description">
                            Calculate and display taxes on orders
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableTaxes}
                        onChange={(checked) => setSettings({ ...settings, enableTaxes: checked })}
                    />
                </div>

                {settings.enableTaxes && (
                    <>
                        <SettingsField
                            label="Default Tax Rate (%)"
                            htmlFor="defaultRate"
                        >
                            <input
                                id="defaultRate"
                                type="number"
                                value={settings.defaultTaxRate}
                                onChange={(e) => setSettings({ ...settings, defaultTaxRate: Number(e.target.value) })}
                                min={0}
                                max={100}
                                step={0.1}
                                style={{ maxWidth: '200px' }}
                            />
                        </SettingsField>

                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">Prices Include Tax</div>
                                <div className="settings-toggle-description">
                                    Product prices already include tax
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings.pricesIncludeTax}
                                onChange={(checked) => setSettings({ ...settings, pricesIncludeTax: checked })}
                            />
                        </div>

                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <div className="settings-toggle-label">Show Tax in Cart</div>
                                <div className="settings-toggle-description">
                                    Display tax breakdown in the cart
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={settings.displayTaxInCart}
                                onChange={(checked) => setSettings({ ...settings, displayTaxInCart: checked })}
                            />
                        </div>
                    </>
                )}
            </SettingsSection>

            {settings.enableTaxes && (
                <SettingsSection
                    title="Tax Regions"
                    description="Define regional tax rates"
                    icon="🗺️"
                    action={
                        <button
                            className="admin-btn admin-btn-outline"
                            onClick={addRegion}
                            style={{ fontSize: '12px', padding: '8px 16px' }}
                        >
                            + Add Region
                        </button>
                    }
                >
                    {settings.taxRegions.map((region, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                background: 'var(--admin-surface-light)',
                                borderRadius: '12px',
                                marginBottom: index < settings.taxRegions.length - 1 ? '12px' : 0,
                            }}
                        >
                            <input
                                type="text"
                                value={region.name}
                                onChange={(e) => updateRegion(index, 'name', e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '8px',
                                    background: '#fff',
                                }}
                                placeholder="Region name"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    value={region.rate}
                                    onChange={(e) => updateRegion(index, 'rate', Number(e.target.value))}
                                    style={{
                                        width: '80px',
                                        padding: '10px 14px',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '8px',
                                        background: '#fff',
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                />
                                <span style={{ color: 'var(--admin-text-muted)' }}>%</span>
                            </div>
                            {settings.taxRegions.length > 1 && (
                                <button
                                    onClick={() => removeRegion(index)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </SettingsSection>
            )}

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
