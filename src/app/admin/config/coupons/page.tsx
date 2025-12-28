"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

type CouponsSettings = {
    // General
    enableCoupons: boolean;
    allowMultipleCoupons: boolean;
    maxCouponsPerOrder: number;
    caseSensitiveCodes: boolean;
    autoApplyCoupons: boolean;
    // Display
    showCouponField: boolean;
    couponFieldLabel: string;
    showAppliedCoupons: boolean;
    showSavingsAmount: boolean;
    // Restrictions
    requireMinimumOrder: boolean;
    defaultMinOrder: number;
    excludeSaleItems: boolean;
    excludeCategories: boolean;
    limitPerCustomer: boolean;
    defaultLimitPerCustomer: number;
    // Expiration
    defaultValidityDays: number;
    sendExpirationReminder: boolean;
    reminderDaysBefore: number;
    // Generation
    autoGenerateCodes: boolean;
    codePrefix: string;
    codeLength: number;
    includeNumbers: boolean;
    includeLetters: boolean;
    // Gift Cards
    enableGiftCards: boolean;
    giftCardPrefix: string;
    minGiftCardAmount: number;
    maxGiftCardAmount: number;
    giftCardValidityMonths: number;
};

const defaultSettings: CouponsSettings = {
    enableCoupons: true,
    allowMultipleCoupons: false,
    maxCouponsPerOrder: 1,
    caseSensitiveCodes: false,
    autoApplyCoupons: false,
    showCouponField: true,
    couponFieldLabel: 'Coupon Code',
    showAppliedCoupons: true,
    showSavingsAmount: true,
    requireMinimumOrder: false,
    defaultMinOrder: 100,
    excludeSaleItems: true,
    excludeCategories: false,
    limitPerCustomer: true,
    defaultLimitPerCustomer: 1,
    defaultValidityDays: 30,
    sendExpirationReminder: true,
    reminderDaysBefore: 3,
    autoGenerateCodes: true,
    codePrefix: '',
    codeLength: 8,
    includeNumbers: true,
    includeLetters: true,
    enableGiftCards: false,
    giftCardPrefix: 'GC-',
    minGiftCardAmount: 50,
    maxGiftCardAmount: 1000,
    giftCardValidityMonths: 12,
};

export default function CouponsSettingsPage() {
    const [settings, setSettings] = useState<CouponsSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('coupons_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<CouponsSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('coupons_settings', settings);
            toast.success('Coupon settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: '🎫' },
        { id: 'display', label: 'Display', icon: '👁️' },
        { id: 'restrictions', label: 'Restrictions', icon: '🚫' },
        { id: 'expiration', label: 'Expiration', icon: '⏰' },
        { id: 'generation', label: 'Generation', icon: '⚡' },
        { id: 'giftcards', label: 'Gift Cards', icon: '🎁' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Coupons & Promotions</h1>
                <p className="settings-page-description">Discount codes and gift cards (35+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'general' && (
                <SettingsSection title="General Coupon Settings" description="Core coupon functionality" icon="🎫">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Coupons</div><div className="settings-toggle-description">Allow discount codes on checkout</div></div><ToggleSwitch checked={settings.enableCoupons} onChange={(c) => setSettings({ ...settings, enableCoupons: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Multiple Coupons</div><div className="settings-toggle-description">Stack multiple codes per order</div></div><ToggleSwitch checked={settings.allowMultipleCoupons} onChange={(c) => setSettings({ ...settings, allowMultipleCoupons: c })} /></div>
                    {settings.allowMultipleCoupons && <SettingsField label="Max Coupons Per Order"><input type="number" value={settings.maxCouponsPerOrder} onChange={(e) => setSettings({ ...settings, maxCouponsPerOrder: Number(e.target.value) })} min={2} max={10} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Case-Sensitive Codes</div></div><ToggleSwitch checked={settings.caseSensitiveCodes} onChange={(c) => setSettings({ ...settings, caseSensitiveCodes: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Apply Coupons</div><div className="settings-toggle-description">Automatically apply available coupons</div></div><ToggleSwitch checked={settings.autoApplyCoupons} onChange={(c) => setSettings({ ...settings, autoApplyCoupons: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'display' && (
                <SettingsSection title="Display Settings" description="How coupons appear" icon="👁️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Coupon Field</div></div><ToggleSwitch checked={settings.showCouponField} onChange={(c) => setSettings({ ...settings, showCouponField: c })} /></div>
                    <SettingsField label="Coupon Field Label"><input type="text" value={settings.couponFieldLabel} onChange={(e) => setSettings({ ...settings, couponFieldLabel: e.target.value })} style={{ maxWidth: '250px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Applied Coupons</div></div><ToggleSwitch checked={settings.showAppliedCoupons} onChange={(c) => setSettings({ ...settings, showAppliedCoupons: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Savings Amount</div></div><ToggleSwitch checked={settings.showSavingsAmount} onChange={(c) => setSettings({ ...settings, showSavingsAmount: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'restrictions' && (
                <SettingsSection title="Coupon Restrictions" description="Default restrictions for new coupons" icon="🚫">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Minimum Order</div></div><ToggleSwitch checked={settings.requireMinimumOrder} onChange={(c) => setSettings({ ...settings, requireMinimumOrder: c })} /></div>
                    {settings.requireMinimumOrder && <SettingsField label="Default Minimum Order"><input type="number" value={settings.defaultMinOrder} onChange={(e) => setSettings({ ...settings, defaultMinOrder: Number(e.target.value) })} min={0} style={{ maxWidth: '150px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Exclude Sale Items</div></div><ToggleSwitch checked={settings.excludeSaleItems} onChange={(c) => setSettings({ ...settings, excludeSaleItems: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Exclude Certain Categories</div></div><ToggleSwitch checked={settings.excludeCategories} onChange={(c) => setSettings({ ...settings, excludeCategories: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Limit Per Customer</div></div><ToggleSwitch checked={settings.limitPerCustomer} onChange={(c) => setSettings({ ...settings, limitPerCustomer: c })} /></div>
                    {settings.limitPerCustomer && <SettingsField label="Default Uses Per Customer"><input type="number" value={settings.defaultLimitPerCustomer} onChange={(e) => setSettings({ ...settings, defaultLimitPerCustomer: Number(e.target.value) })} min={1} style={{ maxWidth: '80px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'expiration' && (
                <SettingsSection title="Expiration Settings" description="Validity and reminders" icon="⏰">
                    <SettingsField label="Default Validity (days)"><input type="number" value={settings.defaultValidityDays} onChange={(e) => setSettings({ ...settings, defaultValidityDays: Number(e.target.value) })} min={1} max={365} style={{ maxWidth: '100px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Send Expiration Reminder</div></div><ToggleSwitch checked={settings.sendExpirationReminder} onChange={(c) => setSettings({ ...settings, sendExpirationReminder: c })} /></div>
                    {settings.sendExpirationReminder && <SettingsField label="Days Before Expiration"><input type="number" value={settings.reminderDaysBefore} onChange={(e) => setSettings({ ...settings, reminderDaysBefore: Number(e.target.value) })} min={1} max={14} style={{ maxWidth: '80px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'generation' && (
                <SettingsSection title="Code Generation" description="Auto-generated code format" icon="⚡">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Generate Codes</div></div><ToggleSwitch checked={settings.autoGenerateCodes} onChange={(c) => setSettings({ ...settings, autoGenerateCodes: c })} /></div>
                    {settings.autoGenerateCodes && (<>
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Code Prefix"><input type="text" value={settings.codePrefix} onChange={(e) => setSettings({ ...settings, codePrefix: e.target.value })} placeholder="SAVE" /></SettingsField>
                            <SettingsField label="Code Length"><input type="number" value={settings.codeLength} onChange={(e) => setSettings({ ...settings, codeLength: Number(e.target.value) })} min={4} max={16} /></SettingsField>
                        </div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Include Numbers</div></div><ToggleSwitch checked={settings.includeNumbers} onChange={(c) => setSettings({ ...settings, includeNumbers: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Include Letters</div></div><ToggleSwitch checked={settings.includeLetters} onChange={(c) => setSettings({ ...settings, includeLetters: c })} /></div>
                        <div style={{ padding: '16px', background: 'var(--admin-surface-light)', borderRadius: '12px', marginTop: '16px' }}><strong>Example Code:</strong> {settings.codePrefix}{'X'.repeat(settings.codeLength)}</div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'giftcards' && (
                <SettingsSection title="Gift Cards" description="Digital gift card settings" icon="🎁">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Gift Cards</div></div><ToggleSwitch checked={settings.enableGiftCards} onChange={(c) => setSettings({ ...settings, enableGiftCards: c })} /></div>
                    {settings.enableGiftCards && (<>
                        <SettingsField label="Gift Card Prefix"><input type="text" value={settings.giftCardPrefix} onChange={(e) => setSettings({ ...settings, giftCardPrefix: e.target.value })} style={{ maxWidth: '150px' }} /></SettingsField>
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Min Amount"><input type="number" value={settings.minGiftCardAmount} onChange={(e) => setSettings({ ...settings, minGiftCardAmount: Number(e.target.value) })} min={1} /></SettingsField>
                            <SettingsField label="Max Amount"><input type="number" value={settings.maxGiftCardAmount} onChange={(e) => setSettings({ ...settings, maxGiftCardAmount: Number(e.target.value) })} min={1} /></SettingsField>
                            <SettingsField label="Validity (months)"><input type="number" value={settings.giftCardValidityMonths} onChange={(e) => setSettings({ ...settings, giftCardValidityMonths: Number(e.target.value) })} min={1} max={60} /></SettingsField>
                        </div>
                    </>)}
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-outline" onClick={() => { setSettings(defaultSettings); toast.info('Settings reset to default values'); }} type="button">Reset to Default</button><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
