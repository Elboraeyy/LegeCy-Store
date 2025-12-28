"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import ImageUploader from '@/components/admin/settings/ImageUploader';
import { toast } from 'sonner';

type HeroSettings = {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    imageUrl: string;
};

type HomepageSettings = {
    showFeaturedProducts: boolean;
    featuredProductsCount: number;
    showFeaturedCategories: boolean;
    showTestimonials: boolean;
    showNewsletter: boolean;
    showPromoBanner: boolean;
    promoBannerText: string;
    promoBannerLink: string;
};

const defaultHero: HeroSettings = {
    title: '',
    subtitle: '',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    imageUrl: '',
};

const defaultHomepage: HomepageSettings = {
    showFeaturedProducts: true,
    featuredProductsCount: 8,
    showFeaturedCategories: true,
    showTestimonials: true,
    showNewsletter: true,
    showPromoBanner: false,
    promoBannerText: '',
    promoBannerLink: '',
};

export default function HomepageSettingsPage() {
    const [hero, setHero] = useState<HeroSettings>(defaultHero);
    const [homepage, setHomepage] = useState<HomepageSettings>(defaultHomepage);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const [heroData, homepageData] = await Promise.all([
                    getStoreConfig('homepage_hero'),
                    getStoreConfig('homepage_settings'),
                ]);
                if (heroData) setHero(heroData as HeroSettings);
                if (homepageData) setHomepage(homepageData as HomepageSettings);
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
            await Promise.all([
                updateStoreConfig('homepage_hero', hero),
                updateStoreConfig('homepage_settings', homepage),
            ]);
            toast.success('Homepage settings saved!');
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
                <h1 className="settings-page-title">Homepage</h1>
                <p className="settings-page-description">
                    Customize your store&apos;s homepage sections and hero
                </p>
            </div>

            <SettingsSection
                title="Hero Section"
                description="The main banner on your homepage"
                icon="🖼️"
            >
                <SettingsField
                    label="Hero Title"
                    htmlFor="heroTitle"
                    required
                >
                    <input
                        id="heroTitle"
                        type="text"
                        value={hero.title}
                        onChange={(e) => setHero({ ...hero, title: e.target.value })}
                        placeholder="Summer Collection 2025"
                    />
                </SettingsField>

                <SettingsField
                    label="Hero Subtitle"
                    htmlFor="heroSubtitle"
                >
                    <textarea
                        id="heroSubtitle"
                        value={hero.subtitle}
                        onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                        placeholder="Discover timeless elegance with our new arrivals"
                        rows={3}
                    />
                </SettingsField>

                <div className="settings-grid">
                    <SettingsField
                        label="CTA Button Text"
                        htmlFor="ctaText"
                    >
                        <input
                            id="ctaText"
                            type="text"
                            value={hero.ctaText}
                            onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
                            placeholder="Shop Now"
                        />
                    </SettingsField>

                    <SettingsField
                        label="CTA Button Link"
                        htmlFor="ctaLink"
                    >
                        <input
                            id="ctaLink"
                            type="text"
                            value={hero.ctaLink}
                            onChange={(e) => setHero({ ...hero, ctaLink: e.target.value })}
                            placeholder="/shop"
                        />
                    </SettingsField>
                </div>

                <SettingsField
                    label="Hero Background Image"
                    description="Recommended: 1920x1080px or larger, high quality image"
                >
                    <ImageUploader
                        value={hero.imageUrl}
                        onChange={(url) => setHero({ ...hero, imageUrl: url })}
                        aspectRatio="16/9"
                        placeholder="Upload hero background"
                    />
                </SettingsField>
            </SettingsSection>

            <SettingsSection
                title="Promotional Banner"
                description="Announcement bar at the top of the page"
                icon="📢"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Show Promotional Banner</div>
                        <div className="settings-toggle-description">
                            Display an announcement bar at the top
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={homepage.showPromoBanner}
                        onChange={(checked) => setHomepage({ ...homepage, showPromoBanner: checked })}
                    />
                </div>

                {homepage.showPromoBanner && (
                    <div className="settings-grid" style={{ marginTop: '16px' }}>
                        <SettingsField
                            label="Banner Text"
                            htmlFor="promoText"
                        >
                            <input
                                id="promoText"
                                type="text"
                                value={homepage.promoBannerText}
                                onChange={(e) => setHomepage({ ...homepage, promoBannerText: e.target.value })}
                                placeholder="🎉 Free shipping on orders over $50!"
                            />
                        </SettingsField>

                        <SettingsField
                            label="Banner Link (optional)"
                            htmlFor="promoLink"
                        >
                            <input
                                id="promoLink"
                                type="text"
                                value={homepage.promoBannerLink}
                                onChange={(e) => setHomepage({ ...homepage, promoBannerLink: e.target.value })}
                                placeholder="/sale"
                            />
                        </SettingsField>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                title="Homepage Sections"
                description="Toggle visibility of homepage content blocks"
                icon="🧩"
            >
                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Featured Products</div>
                        <div className="settings-toggle-description">
                            Show a grid of featured products
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={homepage.showFeaturedProducts}
                        onChange={(checked) => setHomepage({ ...homepage, showFeaturedProducts: checked })}
                    />
                </div>

                {homepage.showFeaturedProducts && (
                    <div style={{ paddingLeft: '16px', marginTop: '-8px' }}>
                        <SettingsField
                            label="Number of Products"
                            htmlFor="featuredCount"
                        >
                            <select
                                id="featuredCount"
                                value={homepage.featuredProductsCount}
                                onChange={(e) => setHomepage({ ...homepage, featuredProductsCount: Number(e.target.value) })}
                                style={{ maxWidth: '200px' }}
                            >
                                <option value={4}>4 Products</option>
                                <option value={6}>6 Products</option>
                                <option value={8}>8 Products</option>
                                <option value={12}>12 Products</option>
                            </select>
                        </SettingsField>
                    </div>
                )}

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Featured Categories</div>
                        <div className="settings-toggle-description">
                            Display category cards for quick navigation
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={homepage.showFeaturedCategories}
                        onChange={(checked) => setHomepage({ ...homepage, showFeaturedCategories: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Customer Testimonials</div>
                        <div className="settings-toggle-description">
                            Show featured reviews from customers
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={homepage.showTestimonials}
                        onChange={(checked) => setHomepage({ ...homepage, showTestimonials: checked })}
                    />
                </div>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">Newsletter Signup</div>
                        <div className="settings-toggle-description">
                            Display email subscription form
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={homepage.showNewsletter}
                        onChange={(checked) => setHomepage({ ...homepage, showNewsletter: checked })}
                    />
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
