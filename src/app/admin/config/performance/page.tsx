"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import { toast } from 'sonner';

type PerformanceSettings = {
    // Caching
    enablePageCache: boolean;
    pageCacheDuration: number;
    enableDataCache: boolean;
    dataCacheDuration: number;
    enableBrowserCache: boolean;
    browserCacheMaxAge: number;
    enableCDN: boolean;
    cdnUrl: string;
    
    // Images
    enableImageOptimization: boolean;
    imageQuality: number;
    enableLazyLoading: boolean;
    lazyLoadThreshold: number;
    enableWebP: boolean;
    enableResponsiveImages: boolean;
    thumbnailQuality: number;
    
    // Scripts
    enableMinification: boolean;
    minifyJS: boolean;
    minifyCSS: boolean;
    minifyHTML: boolean;
    enableCompression: boolean;
    compressionLevel: number;
    deferJavaScript: boolean;
    asyncScripts: boolean;
    
    // Database
    enableQueryCache: boolean;
    queryCacheDuration: number;
    enableConnectionPooling: boolean;
    maxConnections: number;
    enableSlowQueryLog: boolean;
    slowQueryThreshold: number;
    
    // Preloading
    enablePreloading: boolean;
    preloadLinks: boolean;
    preloadImages: boolean;
    prefetchPages: string[];
    
    // Monitoring
    enableMonitoring: boolean;
    trackPageSpeed: boolean;
    trackErrors: boolean;
    errorReportingEmail: string;
    performanceAlertThreshold: number;
};

const defaultSettings: PerformanceSettings = {
    enablePageCache: true,
    pageCacheDuration: 3600,
    enableDataCache: true,
    dataCacheDuration: 1800,
    enableBrowserCache: true,
    browserCacheMaxAge: 86400,
    enableCDN: false,
    cdnUrl: '',
    
    enableImageOptimization: true,
    imageQuality: 85,
    enableLazyLoading: true,
    lazyLoadThreshold: 200,
    enableWebP: true,
    enableResponsiveImages: true,
    thumbnailQuality: 75,
    
    enableMinification: true,
    minifyJS: true,
    minifyCSS: true,
    minifyHTML: true,
    enableCompression: true,
    compressionLevel: 6,
    deferJavaScript: true,
    asyncScripts: false,
    
    enableQueryCache: true,
    queryCacheDuration: 600,
    enableConnectionPooling: true,
    maxConnections: 10,
    enableSlowQueryLog: false,
    slowQueryThreshold: 1000,
    
    enablePreloading: true,
    preloadLinks: true,
    preloadImages: true,
    prefetchPages: [],
    
    enableMonitoring: false,
    trackPageSpeed: true,
    trackErrors: true,
    errorReportingEmail: '',
    performanceAlertThreshold: 3000,
};

export default function PerformanceSettingsPage() {
    const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('caching');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('performance_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<PerformanceSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('performance_settings', settings);
            toast.success('Performance settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'caching', label: 'Caching', icon: '💾' },
        { id: 'images', label: 'Images', icon: '🖼️' },
        { id: 'scripts', label: 'Scripts', icon: '📜' },
        { id: 'database', label: 'Database', icon: '🗄️' },
        { id: 'preloading', label: 'Preloading', icon: '⚡' },
        { id: 'monitoring', label: 'Monitoring', icon: '📊' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Performance</h1>
                <p className="settings-page-description">Speed optimization and caching (50+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'caching' && (
                <SettingsSection title="Cache Settings" description="Page and data caching" icon="💾">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Page Cache</div><div className="settings-toggle-description">Cache rendered HTML pages</div></div><ToggleSwitch checked={settings.enablePageCache} onChange={(c) => setSettings({ ...settings, enablePageCache: c })} /></div>
                    {settings.enablePageCache && <SettingsField label="Page Cache Duration (seconds)"><input type="number" value={settings.pageCacheDuration} onChange={(e) => setSettings({ ...settings, pageCacheDuration: Number(e.target.value) })} min={60} max={86400} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Data Cache</div><div className="settings-toggle-description">Cache API responses</div></div><ToggleSwitch checked={settings.enableDataCache} onChange={(c) => setSettings({ ...settings, enableDataCache: c })} /></div>
                    {settings.enableDataCache && <SettingsField label="Data Cache Duration (seconds)"><input type="number" value={settings.dataCacheDuration} onChange={(e) => setSettings({ ...settings, dataCacheDuration: Number(e.target.value) })} min={60} max={86400} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Browser Cache</div><div className="settings-toggle-description">Set cache headers</div></div><ToggleSwitch checked={settings.enableBrowserCache} onChange={(c) => setSettings({ ...settings, enableBrowserCache: c })} /></div>
                    {settings.enableBrowserCache && <SettingsField label="Max Age (seconds)"><input type="number" value={settings.browserCacheMaxAge} onChange={(e) => setSettings({ ...settings, browserCacheMaxAge: Number(e.target.value) })} min={3600} max={604800} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable CDN</div><div className="settings-toggle-description">Serve assets from CDN</div></div><ToggleSwitch checked={settings.enableCDN} onChange={(c) => setSettings({ ...settings, enableCDN: c })} /></div>
                    {settings.enableCDN && <SettingsField label="CDN URL"><input type="text" value={settings.cdnUrl} onChange={(e) => setSettings({ ...settings, cdnUrl: e.target.value })} placeholder="https://cdn.example.com" /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'images' && (
                <SettingsSection title="Image Optimization" description="Compress and optimize images" icon="🖼️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Image Optimization</div></div><ToggleSwitch checked={settings.enableImageOptimization} onChange={(c) => setSettings({ ...settings, enableImageOptimization: c })} /></div>
                    {settings.enableImageOptimization && (<>
                        <SettingsField label="Image Quality (%)"><input type="number" value={settings.imageQuality} onChange={(e) => setSettings({ ...settings, imageQuality: Number(e.target.value) })} min={50} max={100} style={{ maxWidth: '100px' }} /></SettingsField>
                        <SettingsField label="Thumbnail Quality (%)"><input type="number" value={settings.thumbnailQuality} onChange={(e) => setSettings({ ...settings, thumbnailQuality: Number(e.target.value) })} min={50} max={100} style={{ maxWidth: '100px' }} /></SettingsField>
                    </>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Lazy Loading</div><div className="settings-toggle-description">Load images on scroll</div></div><ToggleSwitch checked={settings.enableLazyLoading} onChange={(c) => setSettings({ ...settings, enableLazyLoading: c })} /></div>
                    {settings.enableLazyLoading && <SettingsField label="Load Threshold (px)"><input type="number" value={settings.lazyLoadThreshold} onChange={(e) => setSettings({ ...settings, lazyLoadThreshold: Number(e.target.value) })} min={0} max={500} style={{ maxWidth: '100px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">WebP Format</div><div className="settings-toggle-description">Serve WebP images</div></div><ToggleSwitch checked={settings.enableWebP} onChange={(c) => setSettings({ ...settings, enableWebP: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Responsive Images</div><div className="settings-toggle-description">Multiple sizes</div></div><ToggleSwitch checked={settings.enableResponsiveImages} onChange={(c) => setSettings({ ...settings, enableResponsiveImages: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'scripts' && (
                <SettingsSection title="Script Optimization" description="Minify and compress" icon="📜">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Minification</div></div><ToggleSwitch checked={settings.enableMinification} onChange={(c) => setSettings({ ...settings, enableMinification: c })} /></div>
                    {settings.enableMinification && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Minify JavaScript</div></div><ToggleSwitch checked={settings.minifyJS} onChange={(c) => setSettings({ ...settings, minifyJS: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Minify CSS</div></div><ToggleSwitch checked={settings.minifyCSS} onChange={(c) => setSettings({ ...settings, minifyCSS: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Minify HTML</div></div><ToggleSwitch checked={settings.minifyHTML} onChange={(c) => setSettings({ ...settings, minifyHTML: c })} /></div>
                    </>)}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Compression</div><div className="settings-toggle-description">Gzip/Brotli</div></div><ToggleSwitch checked={settings.enableCompression} onChange={(c) => setSettings({ ...settings, enableCompression: c })} /></div>
                    {settings.enableCompression && <SettingsField label="Compression Level (1-9)"><input type="number" value={settings.compressionLevel} onChange={(e) => setSettings({ ...settings, compressionLevel: Number(e.target.value) })} min={1} max={9} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Defer JavaScript</div></div><ToggleSwitch checked={settings.deferJavaScript} onChange={(c) => setSettings({ ...settings, deferJavaScript: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Async Scripts</div></div><ToggleSwitch checked={settings.asyncScripts} onChange={(c) => setSettings({ ...settings, asyncScripts: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'database' && (
                <SettingsSection title="Database Optimization" description="Query caching and connections" icon="🗄️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Query Cache</div></div><ToggleSwitch checked={settings.enableQueryCache} onChange={(c) => setSettings({ ...settings, enableQueryCache: c })} /></div>
                    {settings.enableQueryCache && <SettingsField label="Cache Duration (seconds)"><input type="number" value={settings.queryCacheDuration} onChange={(e) => setSettings({ ...settings, queryCacheDuration: Number(e.target.value) })} min={60} max={3600} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Connection Pooling</div></div><ToggleSwitch checked={settings.enableConnectionPooling} onChange={(c) => setSettings({ ...settings, enableConnectionPooling: c })} /></div>
                    {settings.enableConnectionPooling && <SettingsField label="Max Connections"><input type="number" value={settings.maxConnections} onChange={(e) => setSettings({ ...settings, maxConnections: Number(e.target.value) })} min={5} max={50} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Slow Query Log</div></div><ToggleSwitch checked={settings.enableSlowQueryLog} onChange={(c) => setSettings({ ...settings, enableSlowQueryLog: c })} /></div>
                    {settings.enableSlowQueryLog && <SettingsField label="Threshold (ms)"><input type="number" value={settings.slowQueryThreshold} onChange={(e) => setSettings({ ...settings, slowQueryThreshold: Number(e.target.value) })} min={100} max={5000} style={{ maxWidth: '100px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'preloading' && (
                <SettingsSection title="Preloading" description="Prefetch resources" icon="⚡">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Preloading</div></div><ToggleSwitch checked={settings.enablePreloading} onChange={(c) => setSettings({ ...settings, enablePreloading: c })} /></div>
                    {settings.enablePreloading && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Preload Links</div></div><ToggleSwitch checked={settings.preloadLinks} onChange={(c) => setSettings({ ...settings, preloadLinks: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Preload Images</div></div><ToggleSwitch checked={settings.preloadImages} onChange={(c) => setSettings({ ...settings, preloadImages: c })} /></div>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'monitoring' && (
                <SettingsSection title="Performance Monitoring" description="Track and alert" icon="📊">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Monitoring</div></div><ToggleSwitch checked={settings.enableMonitoring} onChange={(c) => setSettings({ ...settings, enableMonitoring: c })} /></div>
                    {settings.enableMonitoring && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Track Page Speed</div></div><ToggleSwitch checked={settings.trackPageSpeed} onChange={(c) => setSettings({ ...settings, trackPageSpeed: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Track Errors</div></div><ToggleSwitch checked={settings.trackErrors} onChange={(c) => setSettings({ ...settings, trackErrors: c })} /></div>
                        <SettingsField label="Alert Email"><input type="email" value={settings.errorReportingEmail} onChange={(e) => setSettings({ ...settings, errorReportingEmail: e.target.value })} placeholder="admin@example.com" /></SettingsField>
                        <SettingsField label="Alert Threshold (ms)"><input type="number" value={settings.performanceAlertThreshold} onChange={(e) => setSettings({ ...settings, performanceAlertThreshold: Number(e.target.value) })} min={1000} max={10000} style={{ maxWidth: '120px' }} /></SettingsField>
                    </>)}
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
