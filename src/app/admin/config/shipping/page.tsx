"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, ShippingSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

import { EGYPT_LOCATIONS } from '@/data/egypt-locations';

// All Egyptian governorates
const EGYPT_GOVERNORATES = EGYPT_LOCATIONS.map(gov => gov.en);

const defaultSettings: ShippingSettings = {
    enableShipping: true,
    freeShippingThreshold: 0,
    defaultShippingRate: 50,
    expressShippingRate: 100,
    shippingZones: [
        { name: 'Cairo & Giza', governorates: ['Cairo', 'Giza'], cities: [], rate: 40 },
        { name: 'Alexandria', governorates: ['Alexandria'], cities: [], rate: 50 },
        { name: 'Other Governorates', governorates: [], cities: [], rate: 70 },
    ],
};

export default function ShippingSettingsPage() {
    const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for city selection dropdowns in zones
    const [cityAddingState, setCityAddingState] = useState<Record<number, { governorate: string; city: string; rate: number }>>({});

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

    const updateZoneGovernorates = (index: number, governorates: string[]) => {
        const newZones = [...settings.shippingZones];
        newZones[index] = { ...newZones[index], governorates };
        setSettings({ ...settings, shippingZones: newZones });
    };

    const toggleGovernorateInZone = (index: number, gov: string) => {
        const zone = settings.shippingZones[index];
        const currentGovs = zone.governorates || [];
        const governorates = currentGovs.includes(gov)
            ? currentGovs.filter(g => g !== gov)
            : [...currentGovs, gov];
        updateZoneGovernorates(index, governorates);
    };

    const updateZoneCities = (index: number, cities: Array<{ governorate: string; city: string; rate: number }>) => {
        const newZones = [...settings.shippingZones];
        newZones[index] = { ...newZones[index], cities };
        setSettings({ ...settings, shippingZones: newZones });
    };

    const addCityToZone = (index: number) => {
        const selection = cityAddingState[index];
        if (!selection || !selection.governorate || !selection.city) return;

        const zone = settings.shippingZones[index];
        const currentCities = zone.cities || [];

        // Prevent duplicates
        if (currentCities.some(c => c.governorate === selection.governorate && c.city === selection.city)) {
            toast.error('This city is already in this zone');
            return;
        }

        updateZoneCities(index, [...currentCities, {
            governorate: selection.governorate,
            city: selection.city,
            rate: selection.rate ?? zone.rate // Use zone rate as default if not specified
        }]);

        // Reset adding state for this zone
        setCityAddingState(prev => ({
            ...prev,
            [index]: { governorate: selection.governorate, city: '', rate: zone.rate }
        }));
        toast.success(`Added ${selection.city} to ${zone.name}`);
    };

    const removeCityFromZone = (index: number, cityIndex: number) => {
        const zone = settings.shippingZones[index];
        const newCities = (zone.cities || []).filter((_, i) => i !== cityIndex);
        updateZoneCities(index, newCities);
    };

    const addZone = () => {
        setSettings({
            ...settings,
            shippingZones: [
                ...settings.shippingZones,
                { name: 'New Zone', governorates: [], cities: [], rate: 50 },
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
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--admin-text-secondary)' }}>
                                Governorates in this zone ({(zone.governorates || []).length} selected)
                            </label>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                maxHeight: '150px',
                                overflowY: 'auto',
                                padding: '12px',
                                background: 'var(--admin-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border)'
                            }}>
                                {EGYPT_GOVERNORATES.map(gov => (
                                    <button
                                        key={gov}
                                        type="button"
                                        onClick={() => toggleGovernorateInZone(index, gov)}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '12px',
                                            borderRadius: '99px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: (zone.governorates || []).includes(gov) ? '#12403C' : 'var(--admin-surface)',
                                            color: (zone.governorates || []).includes(gov) ? '#fff' : 'var(--admin-text)',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {gov}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '6px' }}>
                                Full governorates included.
                            </p>
                        </div>

                        {/* City Exceptions */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--admin-border)' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--admin-text-secondary)' }}>
                                Specific City Exceptions ({(zone.cities || []).length})
                            </label>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <select
                                    style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', fontSize: '13px' }}
                                    value={cityAddingState[index]?.governorate || ''}
                                    onChange={(e) => setCityAddingState(prev => ({ ...prev, [index]: { governorate: e.target.value, city: '', rate: zone.rate } }))}
                                >
                                    <option value="">Select Governorate</option>
                                    {EGYPT_GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                </select>

                                <select
                                    style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', fontSize: '13px' }}
                                    value={cityAddingState[index]?.city || ''}
                                    onChange={(e) => setCityAddingState(prev => ({ ...prev, [index]: { ...prev[index], city: e.target.value } }))}
                                    disabled={!cityAddingState[index]?.governorate}
                                >
                                    <option value="">Select City</option>
                                    {cityAddingState[index]?.governorate && EGYPT_LOCATIONS.find(l => l.en === cityAddingState[index].governorate)?.cities.map(c => (
                                        <option key={c.en} value={c.en}>{c.en}</option>
                                    ))}
                                </select>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '120px' }}>
                                    <span style={{ fontSize: '12px' }}>EGP</span>
                                    <input
                                        type="number"
                                        placeholder="Rate"
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', fontSize: '13px' }}
                                        value={cityAddingState[index]?.rate ?? zone.rate}
                                        onChange={(e) => setCityAddingState(prev => ({ ...prev, [index]: { ...prev[index], rate: Number(e.target.value) } }))}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="admin-btn admin-btn-primary"
                                    style={{ padding: '4px 16px', height: '38px', fontSize: '12px' }}
                                    onClick={() => addCityToZone(index)}
                                    disabled={!cityAddingState[index]?.city}
                                >
                                    Add Exception
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(zone.cities || []).map((cityObj, cityIdx) => (
                                    <div
                                        key={cityIdx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '6px 12px',
                                            background: 'var(--admin-bg)',
                                            border: '1px solid #12403C',
                                            color: 'var(--admin-text)',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{cityObj.city}</span>
                                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '11px' }}>({cityObj.governorate})</span>
                                        <span style={{ padding: '2px 6px', background: '#12403C', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>{cityObj.rate} EGP</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCityFromZone(index, cityIdx)}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginLeft: '4px' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {(zone.cities || []).length === 0 && (
                                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                                        No specific city exceptions in this zone.
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                                City exceptions override governorate-level pricing. Use this to make specific towns cheaper.
                            </p>
                        </div>
                    </div>
                ))}
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
