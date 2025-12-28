"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type CustomersSettings = {
    // Registration
    enableRegistration: boolean;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    autoLogin: boolean;
    registrationFields: string[];
    // Account
    allowAccountDeletion: boolean;
    showOrderHistory: boolean;
    showWishlist: boolean;
    allowAddressBook: boolean;
    maxAddresses: number;
    // Passwords
    minPasswordLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiresDays: number;
    // Loyalty
    enableLoyaltyProgram: boolean;
    pointsPerCurrency: number;
    pointsRedemptionRate: number;
    welcomeBonus: number;
    birthdayBonus: number;
    referralBonus: number;
    // Groups
    enableCustomerGroups: boolean;
    defaultGroup: string;
    enableTierSystem: boolean;
    // Privacy
    gdprCompliance: boolean;
    showCookieConsent: boolean;
    allowDataExport: boolean;
    dataRetentionDays: number;
};

const defaultSettings: CustomersSettings = {
    enableRegistration: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    autoLogin: true,
    registrationFields: ['name', 'email', 'phone'],
    allowAccountDeletion: true,
    showOrderHistory: true,
    showWishlist: true,
    allowAddressBook: true,
    maxAddresses: 5,
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiresDays: 0,
    enableLoyaltyProgram: false,
    pointsPerCurrency: 1,
    pointsRedemptionRate: 100,
    welcomeBonus: 100,
    birthdayBonus: 50,
    referralBonus: 200,
    enableCustomerGroups: true,
    defaultGroup: 'retail',
    enableTierSystem: false,
    gdprCompliance: true,
    showCookieConsent: true,
    allowDataExport: true,
    dataRetentionDays: 365,
};

export default function CustomersSettingsPage() {
    const [settings, setSettings] = useState<CustomersSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('registration');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('customers_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<CustomersSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('customers_settings', settings);
            toast.success('Customer settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'registration', label: 'Registration', icon: '📝' },
        { id: 'account', label: 'Account', icon: '👤' },
        { id: 'passwords', label: 'Passwords', icon: '🔐' },
        { id: 'loyalty', label: 'Loyalty', icon: '⭐' },
        { id: 'groups', label: 'Groups', icon: '👥' },
        { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Customer Accounts</h1>
                <p className="settings-page-description">Registration, loyalty, and privacy (35+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'registration' && (
                <SettingsSection title="Registration Settings" description="Customer sign-up options" icon="📝">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Registration</div><div className="settings-toggle-description">Allow new customers to create accounts</div></div><ToggleSwitch checked={settings.enableRegistration} onChange={(c) => setSettings({ ...settings, enableRegistration: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Email Verification</div></div><ToggleSwitch checked={settings.requireEmailVerification} onChange={(c) => setSettings({ ...settings, requireEmailVerification: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Phone Verification</div></div><ToggleSwitch checked={settings.requirePhoneVerification} onChange={(c) => setSettings({ ...settings, requirePhoneVerification: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Login After Registration</div></div><ToggleSwitch checked={settings.autoLogin} onChange={(c) => setSettings({ ...settings, autoLogin: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'account' && (
                <SettingsSection title="Account Features" description="What customers can do" icon="👤">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Order History</div></div><ToggleSwitch checked={settings.showOrderHistory} onChange={(c) => setSettings({ ...settings, showOrderHistory: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Wishlist</div></div><ToggleSwitch checked={settings.showWishlist} onChange={(c) => setSettings({ ...settings, showWishlist: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Address Book</div></div><ToggleSwitch checked={settings.allowAddressBook} onChange={(c) => setSettings({ ...settings, allowAddressBook: c })} /></div>
                    {settings.allowAddressBook && <SettingsField label="Max Saved Addresses"><input type="number" value={settings.maxAddresses} onChange={(e) => setSettings({ ...settings, maxAddresses: Number(e.target.value) })} min={1} max={20} style={{ maxWidth: '100px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Account Deletion</div><div className="settings-toggle-description">Let customers delete their accounts</div></div><ToggleSwitch checked={settings.allowAccountDeletion} onChange={(c) => setSettings({ ...settings, allowAccountDeletion: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'passwords' && (
                <SettingsSection title="Password Policy" description="Password requirements" icon="🔐">
                    <SettingsField label="Minimum Password Length"><input type="number" value={settings.minPasswordLength} onChange={(e) => setSettings({ ...settings, minPasswordLength: Number(e.target.value) })} min={6} max={32} style={{ maxWidth: '100px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Uppercase Letter</div></div><ToggleSwitch checked={settings.requireUppercase} onChange={(c) => setSettings({ ...settings, requireUppercase: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Numbers</div></div><ToggleSwitch checked={settings.requireNumbers} onChange={(c) => setSettings({ ...settings, requireNumbers: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Special Characters</div></div><ToggleSwitch checked={settings.requireSpecialChars} onChange={(c) => setSettings({ ...settings, requireSpecialChars: c })} /></div>
                    <SettingsField label="Password Expires After (days)" description="0 = never expires"><input type="number" value={settings.passwordExpiresDays} onChange={(e) => setSettings({ ...settings, passwordExpiresDays: Number(e.target.value) })} min={0} max={365} style={{ maxWidth: '100px' }} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'loyalty' && (
                <SettingsSection title="Loyalty Program" description="Rewards and points" icon="⭐">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Loyalty Program</div></div><ToggleSwitch checked={settings.enableLoyaltyProgram} onChange={(c) => setSettings({ ...settings, enableLoyaltyProgram: c })} /></div>
                    {settings.enableLoyaltyProgram && (<>
                        <div className="settings-grid settings-grid-3">
                            <SettingsField label="Points Per Currency Unit"><input type="number" value={settings.pointsPerCurrency} onChange={(e) => setSettings({ ...settings, pointsPerCurrency: Number(e.target.value) })} min={1} /></SettingsField>
                            <SettingsField label="Points to Redeem (per unit)"><input type="number" value={settings.pointsRedemptionRate} onChange={(e) => setSettings({ ...settings, pointsRedemptionRate: Number(e.target.value) })} min={1} /></SettingsField>
                            <SettingsField label="Welcome Bonus Points"><input type="number" value={settings.welcomeBonus} onChange={(e) => setSettings({ ...settings, welcomeBonus: Number(e.target.value) })} min={0} /></SettingsField>
                        </div>
                        <div className="settings-grid">
                            <SettingsField label="Birthday Bonus Points"><input type="number" value={settings.birthdayBonus} onChange={(e) => setSettings({ ...settings, birthdayBonus: Number(e.target.value) })} min={0} /></SettingsField>
                            <SettingsField label="Referral Bonus Points"><input type="number" value={settings.referralBonus} onChange={(e) => setSettings({ ...settings, referralBonus: Number(e.target.value) })} min={0} /></SettingsField>
                        </div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'groups' && (
                <SettingsSection title="Customer Groups" description="Segmentation and tiers" icon="👥">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Customer Groups</div></div><ToggleSwitch checked={settings.enableCustomerGroups} onChange={(c) => setSettings({ ...settings, enableCustomerGroups: c })} /></div>
                    {settings.enableCustomerGroups && (<>
                        <SettingsField label="Default Group"><AdminDropdown value={settings.defaultGroup} onChange={(v) => setSettings({ ...settings, defaultGroup: v })} options={[{ value: 'retail', label: 'Retail' }, { value: 'wholesale', label: 'Wholesale' }, { value: 'vip', label: 'VIP' }]} /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Tier System</div><div className="settings-toggle-description">Auto-upgrade based on spending</div></div><ToggleSwitch checked={settings.enableTierSystem} onChange={(c) => setSettings({ ...settings, enableTierSystem: c })} /></div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'privacy' && (
                <SettingsSection title="Privacy & Compliance" description="GDPR and data handling" icon="🛡️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">GDPR Compliance Mode</div></div><ToggleSwitch checked={settings.gdprCompliance} onChange={(c) => setSettings({ ...settings, gdprCompliance: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Cookie Consent Banner</div></div><ToggleSwitch checked={settings.showCookieConsent} onChange={(c) => setSettings({ ...settings, showCookieConsent: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Data Export</div><div className="settings-toggle-description">Customers can download their data</div></div><ToggleSwitch checked={settings.allowDataExport} onChange={(c) => setSettings({ ...settings, allowDataExport: c })} /></div>
                    <SettingsField label="Data Retention Period (days)"><input type="number" value={settings.dataRetentionDays} onChange={(e) => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })} min={30} max={3650} style={{ maxWidth: '120px' }} /></SettingsField>
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
