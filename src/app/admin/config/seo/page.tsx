"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, SEOSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import { toast } from 'sonner';

const defaultSettings: SEOSettings = {
    metaTitle: '',
    metaDescription: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: '',
    },
};

export default function SEOSettingsPage() {
    const [settings, setSettings] = useState<SEOSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('seo_settings');
                if (data) setSettings(data as SEOSettings);
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
            await updateStoreConfig('seo_settings', settings);
            toast.success('SEO settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateSocialLink = (platform: keyof SEOSettings['socialLinks'], value: string) => {
        setSettings({
            ...settings,
            socialLinks: {
                ...settings.socialLinks,
                [platform]: value,
            },
        });
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
                <h1 className="settings-page-title">SEO & Social</h1>
                <p className="settings-page-description">
                    Optimize for search engines and manage social presence
                </p>
            </div>

            <SettingsSection
                title="Default Meta Tags"
                description="Fallback SEO settings for pages without specific meta"
                icon="🔍"
            >
                <SettingsField
                    label="Meta Title"
                    description="Appears in browser tabs and search results"
                    htmlFor="metaTitle"
                >
                    <input
                        id="metaTitle"
                        type="text"
                        value={settings.metaTitle}
                        onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                        placeholder="Legacy Store - Premium Fashion & Accessories"
                        maxLength={60}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                        {settings.metaTitle.length}/60 characters
                    </div>
                </SettingsField>

                <SettingsField
                    label="Meta Description"
                    description="Brief summary shown in search results"
                    htmlFor="metaDescription"
                >
                    <textarea
                        id="metaDescription"
                        value={settings.metaDescription}
                        onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                        placeholder="Shop premium leather goods, accessories, and fashion items. Free shipping on orders over 500 EGP."
                        maxLength={160}
                        rows={3}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                        {settings.metaDescription.length}/160 characters
                    </div>
                </SettingsField>
            </SettingsSection>

            <SettingsSection
                title="Analytics & Tracking"
                description="Track visitor behavior and conversions"
                icon="📊"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="Google Analytics ID"
                        description="Format: G-XXXXXXXXXX or UA-XXXXXXXX-X"
                        htmlFor="gaId"
                    >
                        <input
                            id="gaId"
                            type="text"
                            value={settings.googleAnalyticsId}
                            onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                            placeholder="G-XXXXXXXXXX"
                        />
                    </SettingsField>

                    <SettingsField
                        label="Facebook Pixel ID"
                        description="For Facebook/Meta ads tracking"
                        htmlFor="fbPixel"
                    >
                        <input
                            id="fbPixel"
                            type="text"
                            value={settings.facebookPixelId}
                            onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                            placeholder="1234567890123456"
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Social Media Links"
                description="Connect your social media profiles"
                icon="🌐"
            >
                <div className="settings-grid">
                    <SettingsField
                        label="Facebook"
                        htmlFor="facebook"
                    >
                        <input
                            id="facebook"
                            type="url"
                            value={settings.socialLinks.facebook}
                            onChange={(e) => updateSocialLink('facebook', e.target.value)}
                            placeholder="https://facebook.com/yourpage"
                        />
                    </SettingsField>

                    <SettingsField
                        label="Instagram"
                        htmlFor="instagram"
                    >
                        <input
                            id="instagram"
                            type="url"
                            value={settings.socialLinks.instagram}
                            onChange={(e) => updateSocialLink('instagram', e.target.value)}
                            placeholder="https://instagram.com/yourprofile"
                        />
                    </SettingsField>
                </div>

                <div className="settings-grid">
                    <SettingsField
                        label="Twitter / X"
                        htmlFor="twitter"
                    >
                        <input
                            id="twitter"
                            type="url"
                            value={settings.socialLinks.twitter}
                            onChange={(e) => updateSocialLink('twitter', e.target.value)}
                            placeholder="https://twitter.com/yourhandle"
                        />
                    </SettingsField>

                    <SettingsField
                        label="TikTok"
                        htmlFor="tiktok"
                    >
                        <input
                            id="tiktok"
                            type="url"
                            value={settings.socialLinks.tiktok}
                            onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                            placeholder="https://tiktok.com/@yourhandle"
                        />
                    </SettingsField>
                </div>

                <SettingsField
                    label="YouTube"
                    htmlFor="youtube"
                >
                    <input
                        id="youtube"
                        type="url"
                        value={settings.socialLinks.youtube}
                        onChange={(e) => updateSocialLink('youtube', e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        style={{ maxWidth: '400px' }}
                    />
                </SettingsField>
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
