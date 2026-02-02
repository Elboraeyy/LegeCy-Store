"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type BackupSettings = {
    // Auto Backup
    enableAutoBackup: boolean;
    backupFrequency: string;
    backupTime: string;
    retainBackups: number;
    
    // Content
    backupDatabase: boolean;
    backupMedia: boolean;
    backupProducts: boolean;
    backupOrders: boolean;
    backupCustomers: boolean;
    backupSettings: boolean;
    
    // Storage
    storageLocation: string;
    localPath: string;
    cloudProvider: string;
    awsAccessKey: string;
    awsBucket: string;
    awsRegion: string;
    googleCloudBucket: string;
    
    // Notifications
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
    notificationEmail: string;
    
    // Security
    encryptBackups: boolean;
    encryptionKey: string;
    compressBackups: boolean;
    compressionLevel: number;
    
    // Recovery
    enablePointInTimeRecovery: boolean;
    recoveryRetentionDays: number;
    enableOneClickRestore: boolean;
    
    // Export
    enableDataExport: boolean;
    exportFormat: string;
    includeImages: boolean;
};

const defaultSettings: BackupSettings = {
    enableAutoBackup: true,
    backupFrequency: 'daily',
    backupTime: '03:00',
    retainBackups: 7,
    
    backupDatabase: true,
    backupMedia: true,
    backupProducts: true,
    backupOrders: true,
    backupCustomers: true,
    backupSettings: true,
    
    storageLocation: 'local',
    localPath: '/backups',
    cloudProvider: 'aws',
    awsAccessKey: '',
    awsBucket: '',
    awsRegion: 'us-east-1',
    googleCloudBucket: '',
    
    notifyOnSuccess: false,
    notifyOnFailure: true,
    notificationEmail: '',
    
    encryptBackups: true,
    encryptionKey: '',
    compressBackups: true,
    compressionLevel: 6,
    
    enablePointInTimeRecovery: false,
    recoveryRetentionDays: 30,
    enableOneClickRestore: true,
    
    enableDataExport: true,
    exportFormat: 'json',
    includeImages: false,
};

export default function BackupSettingsPage() {
    const [settings, setSettings] = useState<BackupSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('schedule');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('backup_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<BackupSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('backup_settings', settings);
            toast.success('Backup settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'schedule', label: 'Schedule', icon: '📅' },
        { id: 'content', label: 'Content', icon: '📦' },
        { id: 'storage', label: 'Storage', icon: '☁️' },
        { id: 'security', label: 'Security', icon: '🔐' },
        { id: 'recovery', label: 'Recovery', icon: '🔄' },
        { id: 'export', label: 'Export', icon: '📤' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Backup & Recovery</h1>
                <p className="settings-page-description">Data backup, storage, and restore (40+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'schedule' && (
                <SettingsSection title="Backup Schedule" description="Automatic backup settings" icon="📅">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Auto Backup</div></div><ToggleSwitch checked={settings.enableAutoBackup} onChange={(c) => setSettings({ ...settings, enableAutoBackup: c })} /></div>
                    {settings.enableAutoBackup && (<>
                        <SettingsField label="Backup Frequency"><AdminDropdown value={settings.backupFrequency} onChange={(v) => setSettings({ ...settings, backupFrequency: v })} options={[{ value: 'hourly', label: 'Every Hour' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} /></SettingsField>
                        <SettingsField label="Backup Time"><input type="time" value={settings.backupTime} onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })} /></SettingsField>
                        <SettingsField label="Retain Backups (count)"><input type="number" value={settings.retainBackups} onChange={(e) => setSettings({ ...settings, retainBackups: Number(e.target.value) })} min={1} max={30} style={{ maxWidth: '80px' }} /></SettingsField>
                    </>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Notify on Success</div></div><ToggleSwitch checked={settings.notifyOnSuccess} onChange={(c) => setSettings({ ...settings, notifyOnSuccess: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Notify on Failure</div></div><ToggleSwitch checked={settings.notifyOnFailure} onChange={(c) => setSettings({ ...settings, notifyOnFailure: c })} /></div>
                    <SettingsField label="Notification Email"><input type="email" value={settings.notificationEmail} onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'content' && (
                <SettingsSection title="Backup Content" description="What to include" icon="📦">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Database</div></div><ToggleSwitch checked={settings.backupDatabase} onChange={(c) => setSettings({ ...settings, backupDatabase: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Media Files</div></div><ToggleSwitch checked={settings.backupMedia} onChange={(c) => setSettings({ ...settings, backupMedia: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Products</div></div><ToggleSwitch checked={settings.backupProducts} onChange={(c) => setSettings({ ...settings, backupProducts: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Orders</div></div><ToggleSwitch checked={settings.backupOrders} onChange={(c) => setSettings({ ...settings, backupOrders: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Customers</div></div><ToggleSwitch checked={settings.backupCustomers} onChange={(c) => setSettings({ ...settings, backupCustomers: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Settings</div></div><ToggleSwitch checked={settings.backupSettings} onChange={(c) => setSettings({ ...settings, backupSettings: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'storage' && (
                <SettingsSection title="Storage Location" description="Where to store backups" icon="☁️">
                    <SettingsField label="Storage Location"><AdminDropdown value={settings.storageLocation} onChange={(v) => setSettings({ ...settings, storageLocation: v })} options={[{ value: 'local', label: 'Local Server' }, { value: 'cloud', label: 'Cloud Storage' }]} /></SettingsField>
                    {settings.storageLocation === 'local' && <SettingsField label="Local Path"><input type="text" value={settings.localPath} onChange={(e) => setSettings({ ...settings, localPath: e.target.value })} /></SettingsField>}
                    {settings.storageLocation === 'cloud' && (<>
                        <SettingsField label="Cloud Provider"><AdminDropdown value={settings.cloudProvider} onChange={(v) => setSettings({ ...settings, cloudProvider: v })} options={[{ value: 'aws', label: 'Amazon S3' }, { value: 'google', label: 'Google Cloud' }, { value: 'azure', label: 'Azure Blob' }]} /></SettingsField>
                        {settings.cloudProvider === 'aws' && (<>
                            <SettingsField label="AWS Access Key"><input type="text" value={settings.awsAccessKey} onChange={(e) => setSettings({ ...settings, awsAccessKey: e.target.value })} /></SettingsField>
                            <SettingsField label="S3 Bucket"><input type="text" value={settings.awsBucket} onChange={(e) => setSettings({ ...settings, awsBucket: e.target.value })} /></SettingsField>
                            <SettingsField label="Region"><input type="text" value={settings.awsRegion} onChange={(e) => setSettings({ ...settings, awsRegion: e.target.value })} /></SettingsField>
                        </>)}
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'security' && (
                <SettingsSection title="Backup Security" description="Encryption and compression" icon="🔐">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Encrypt Backups</div></div><ToggleSwitch checked={settings.encryptBackups} onChange={(c) => setSettings({ ...settings, encryptBackups: c })} /></div>
                    {settings.encryptBackups && <SettingsField label="Encryption Key"><input type="password" value={settings.encryptionKey} onChange={(e) => setSettings({ ...settings, encryptionKey: e.target.value })} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Compress Backups</div></div><ToggleSwitch checked={settings.compressBackups} onChange={(c) => setSettings({ ...settings, compressBackups: c })} /></div>
                    {settings.compressBackups && <SettingsField label="Compression Level (1-9)"><input type="number" value={settings.compressionLevel} onChange={(e) => setSettings({ ...settings, compressionLevel: Number(e.target.value) })} min={1} max={9} style={{ maxWidth: '80px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'recovery' && (
                <SettingsSection title="Recovery Options" description="Restore capabilities" icon="🔄">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Point-in-Time Recovery</div></div><ToggleSwitch checked={settings.enablePointInTimeRecovery} onChange={(c) => setSettings({ ...settings, enablePointInTimeRecovery: c })} /></div>
                    {settings.enablePointInTimeRecovery && <SettingsField label="Retention Days"><input type="number" value={settings.recoveryRetentionDays} onChange={(e) => setSettings({ ...settings, recoveryRetentionDays: Number(e.target.value) })} min={1} max={90} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">One-Click Restore</div></div><ToggleSwitch checked={settings.enableOneClickRestore} onChange={(c) => setSettings({ ...settings, enableOneClickRestore: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'export' && (
                <SettingsSection title="System Backup & Export" description="Download a full copy of your database" icon="bx bx-download">
                    <div className="admin-card" style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}>
                        <div style={{ marginBottom: '16px', fontSize: '48px', color: 'var(--admin-primary)' }}>📦</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Full Database Backup</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
                            Download a complete JSON snapshot of your entire system. This file contains all products, orders, users, and configuration.
                            Keep this file safe for disaster recovery.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.open('/api/admin/backup', '_blank')}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '12px 24px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <span>Download Backup Now</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        </button>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Automated Data Export</div></div><ToggleSwitch checked={settings.enableDataExport} onChange={(c) => setSettings({ ...settings, enableDataExport: c })} /></div>
                        {settings.enableDataExport && (<>
                            <SettingsField label="Export Format"><AdminDropdown value={settings.exportFormat} onChange={(v) => setSettings({ ...settings, exportFormat: v })} options={[{ value: 'json', label: 'JSON' }, { value: 'csv', label: 'CSV' }, { value: 'xml', label: 'XML' }]} /></SettingsField>
                            <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Include Images</div></div><ToggleSwitch checked={settings.includeImages} onChange={(c) => setSettings({ ...settings, includeImages: c })} /></div>
                        </>)}
                    </div>
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-outline" onClick={() => { setSettings(defaultSettings); toast.info('Settings reset to default values'); }} type="button">Reset to Default</button><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
