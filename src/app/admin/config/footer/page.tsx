"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, FooterSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

const defaultSettings: FooterSettings = {
    companyName: '',
    companyDescription: '',
    copyrightText: '',
    showPaymentIcons: true,
    showSocialIcons: true,
    showNewsletter: true,
    newsletterTitle: 'Subscribe to our newsletter',
    columns: [],
    addresses: []
};

export default function FooterSettingsPage() {
    const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('footer_settings');
                if (data) setSettings(data as FooterSettings);
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
            await updateStoreConfig('footer_settings', settings);
            toast.success('Footer settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Column Management
    const addColumn = () => {
        setSettings({
            ...settings,
            columns: [...settings.columns, { title: 'New Column', links: [] }]
        });
    };

    const removeColumn = (index: number) => {
        const newColumns = [...settings.columns];
        newColumns.splice(index, 1);
        setSettings({ ...settings, columns: newColumns });
    };

    const updateColumnTitle = (index: number, title: string) => {
        const newColumns = [...settings.columns];
        newColumns[index].title = title;
        setSettings({ ...settings, columns: newColumns });
    };

    const addLink = (colIndex: number) => {
        const newColumns = [...settings.columns];
        newColumns[colIndex].links.push({ label: 'New Link', url: '/' });
        setSettings({ ...settings, columns: newColumns });
    };

    const removeLink = (colIndex: number, linkIndex: number) => {
        const newColumns = [...settings.columns];
        newColumns[colIndex].links.splice(linkIndex, 1);
        setSettings({ ...settings, columns: newColumns });
    };

    const updateLink = (colIndex: number, linkIndex: number, field: 'label' | 'url', value: string) => {
        const newColumns = [...settings.columns];
        newColumns[colIndex].links[linkIndex][field] = value;
        setSettings({ ...settings, columns: newColumns });
    };

    // Address Management
    const addAddress = () => {
        setSettings({
            ...settings,
            addresses: [...settings.addresses, { title: 'New Branch', address: '', phone: '' }]
        });
    };

    const removeAddress = (index: number) => {
        const newAddresses = [...settings.addresses];
        newAddresses.splice(index, 1);
        setSettings({ ...settings, addresses: newAddresses });
    };

    const updateAddress = (index: number, field: keyof FooterSettings['addresses'][0], value: string) => {
        const newAddresses = [...settings.addresses];
        newAddresses[index] = { ...newAddresses[index], [field]: value };
        setSettings({ ...settings, addresses: newAddresses });
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
                <h1 className="settings-page-title">Footer Settings</h1>
                <p className="settings-page-description">
                    Configure footer content, columns, and layout
                </p>
            </div>

            <SettingsSection
                title="Company Information"
                description="Basic company details displayed in the footer"
                icon="🏢"
            >
                <div className="settings-grid">
                    <SettingsField label="Company Name" htmlFor="companyName">
                        <input
                            id="companyName"
                            type="text"
                            value={settings.companyName}
                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            placeholder="The Legacy Company"
                        />
                    </SettingsField>
                    <SettingsField label="Copyright Text" htmlFor="copyrightText">
                        <input
                            id="copyrightText"
                            type="text"
                            value={settings.copyrightText}
                            onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                            placeholder="© 2025 Legacy Store. All rights reserved."
                        />
                    </SettingsField>
                </div>
                <SettingsField label="Company Description" htmlFor="companyDescription">
                    <textarea
                        id="companyDescription"
                        value={settings.companyDescription}
                        onChange={(e) => setSettings({ ...settings, companyDescription: e.target.value })}
                        placeholder="Short description about your store..."
                        rows={3}
                    />
                </SettingsField>
            </SettingsSection>

            <SettingsSection
                title="Footer Features"
                description="Toggle visibility of footer sections"
                icon="⚙️"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Show Social Media Icons</div>
                        <div className="settings-toggle-description">
                            Display links to your social media profiles
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.showSocialIcons}
                        onChange={(checked) => setSettings({ ...settings, showSocialIcons: checked })}
                    />
                </div>
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Show Payment Icons</div>
                        <div className="settings-toggle-description">
                            Display accepted payment methods
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.showPaymentIcons}
                        onChange={(checked) => setSettings({ ...settings, showPaymentIcons: checked })}
                    />
                </div>
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Show Newsletter Subscription</div>
                        <div className="settings-toggle-description">
                            Allow users to subscribe to email updates
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.showNewsletter}
                        onChange={(checked) => setSettings({ ...settings, showNewsletter: checked })}
                    />
                </div>
                {settings.showNewsletter && (
                    <SettingsField label="Newsletter Title" htmlFor="newsletterTitle">
                        <input
                            id="newsletterTitle"
                            type="text"
                            value={settings.newsletterTitle}
                            onChange={(e) => setSettings({ ...settings, newsletterTitle: e.target.value })}
                        />
                    </SettingsField>
                )}
            </SettingsSection>

            <SettingsSection
                title="Link Columns"
                description="Manage footer link columns"
                icon="🔗"
                action={
                    <button className="admin-btn admin-btn-outline" onClick={addColumn} style={{ fontSize: '12px' }}>
                        + Add Column
                    </button>
                }
            >
                {settings.columns.map((col, colIndex) => (
                    <div key={colIndex} style={{ 
                        background: 'var(--admin-surface-light)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: '1px solid var(--admin-border)'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                value={col.title}
                                onChange={(e) => updateColumnTitle(colIndex, e.target.value)}
                                placeholder="Column Title"
                                style={{ flex: 1, fontWeight: 'bold' }}
                            />
                            <button 
                                onClick={() => removeColumn(colIndex)}
                                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Remove
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {col.links.map((link, linkIndex) => (
                                <div key={linkIndex} style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={link.label}
                                        onChange={(e) => updateLink(colIndex, linkIndex, 'label', e.target.value)}
                                        placeholder="Label"
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="text"
                                        value={link.url}
                                        onChange={(e) => updateLink(colIndex, linkIndex, 'url', e.target.value)}
                                        placeholder="URL"
                                        style={{ flex: 1 }}
                                    />
                                    <button 
                                        onClick={() => removeLink(colIndex, linkIndex)}
                                        style={{ color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={() => addLink(colIndex)}
                                style={{ 
                                    alignSelf: 'flex-start', 
                                    fontSize: '12px', 
                                    color: 'var(--admin-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginTop: '4px'
                                }}
                            >
                                + Add Link
                            </button>
                        </div>
                    </div>
                ))}
                {settings.columns.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        No columns added. Click &quot;Add Column&quot; to start.
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Addresses & Locations"
                description="Manage store locations"
                icon="📍"
                action={
                    <button className="admin-btn admin-btn-outline" onClick={addAddress} style={{ fontSize: '12px' }}>
                        + Add Address
                    </button>
                }
            >
                {settings.addresses.map((addr, index) => (
                    <div key={index} style={{ 
                        background: 'var(--admin-surface-light)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: '1px solid var(--admin-border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button 
                                onClick={() => removeAddress(index)}
                                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Remove
                            </button>
                        </div>
                        <div className="settings-grid">
                            <SettingsField label="Title" htmlFor={`addr-title-${index}`}>
                                <input
                                    id={`addr-title-${index}`}
                                    type="text"
                                    value={addr.title}
                                    onChange={(e) => updateAddress(index, 'title', e.target.value)}
                                    placeholder="Head Office"
                                />
                            </SettingsField>
                            <SettingsField label="Phone" htmlFor={`addr-phone-${index}`}>
                                <input
                                    id={`addr-phone-${index}`}
                                    type="text"
                                    value={addr.phone || ''}
                                    onChange={(e) => updateAddress(index, 'phone', e.target.value)}
                                    placeholder="+1 234 567 890"
                                />
                            </SettingsField>
                        </div>
                        <SettingsField label="Address" htmlFor={`addr-text-${index}`}>
                            <textarea
                                id={`addr-text-${index}`}
                                value={addr.address}
                                onChange={(e) => updateAddress(index, 'address', e.target.value)}
                                placeholder="Full address..."
                                rows={2}
                            />
                        </SettingsField>
                    </div>
                ))}
                {settings.addresses.length === 0 && (
                     <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        No addresses added. Click &quot;Add Address&quot; to start.
                    </div>
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
