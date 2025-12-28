"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type ReviewsSettings = {
    // Core
    enableReviews: boolean;
    requirePurchase: boolean;
    requireApproval: boolean;
    autoApprove: boolean;
    autoApproveMinRating: number;
    // Display
    showRatings: boolean;
    showReviewCount: boolean;
    showAverageRating: boolean;
    showReviewDate: boolean;
    showVerifiedBadge: boolean;
    sortBy: string;
    reviewsPerPage: number;
    // Content
    allowPhotos: boolean;
    maxPhotosPerReview: number;
    allowVideos: boolean;
    minReviewLength: number;
    maxReviewLength: number;
    enableTitle: boolean;
    enableProsAndCons: boolean;
    // Rating
    ratingScale: number;
    showHalfStars: boolean;
    enableCriteriaRating: boolean;
    ratingCriteria: string[];
    // Notifications
    notifyAdminNewReview: boolean;
    notifyCustomerApproved: boolean;
    notifyCustomerRejected: boolean;
    askForReviewAfterDays: number;
    // Spam Protection
    oneReviewPerProduct: boolean;
    enableCaptcha: boolean;
    blockBannedWords: boolean;
    bannedWords: string;
    requireVerifiedEmail: boolean;
};

const defaultSettings: ReviewsSettings = {
    enableReviews: true,
    requirePurchase: true,
    requireApproval: true,
    autoApprove: false,
    autoApproveMinRating: 4,
    showRatings: true,
    showReviewCount: true,
    showAverageRating: true,
    showReviewDate: true,
    showVerifiedBadge: true,
    sortBy: 'newest',
    reviewsPerPage: 10,
    allowPhotos: true,
    maxPhotosPerReview: 5,
    allowVideos: false,
    minReviewLength: 20,
    maxReviewLength: 2000,
    enableTitle: true,
    enableProsAndCons: false,
    ratingScale: 5,
    showHalfStars: false,
    enableCriteriaRating: false,
    ratingCriteria: ['Quality', 'Value', 'Shipping'],
    notifyAdminNewReview: true,
    notifyCustomerApproved: true,
    notifyCustomerRejected: false,
    askForReviewAfterDays: 7,
    oneReviewPerProduct: true,
    enableCaptcha: false,
    blockBannedWords: true,
    bannedWords: '',
    requireVerifiedEmail: false,
};

export default function ReviewsSettingsPage() {
    const [settings, setSettings] = useState<ReviewsSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('core');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('reviews_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<ReviewsSettings>) });
            } catch { console.error('Failed to load'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('reviews_settings', settings);
            toast.success('Reviews settings saved!');
        } catch { toast.error('Failed to save'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'core', label: 'Core', icon: '⭐' },
        { id: 'display', label: 'Display', icon: '👁️' },
        { id: 'content', label: 'Content', icon: '📝' },
        { id: 'rating', label: 'Rating', icon: '🌟' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'spam', label: 'Spam Protection', icon: '🛡️' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Reviews & Ratings</h1>
                <p className="settings-page-description">Customer feedback and rating system (40+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'core' && (
                <SettingsSection title="Core Review Settings" description="Basic review functionality" icon="⭐">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Reviews</div><div className="settings-toggle-description">Allow customers to leave reviews</div></div><ToggleSwitch checked={settings.enableReviews} onChange={(c) => setSettings({ ...settings, enableReviews: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Purchase</div><div className="settings-toggle-description">Only buyers can review</div></div><ToggleSwitch checked={settings.requirePurchase} onChange={(c) => setSettings({ ...settings, requirePurchase: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Approval</div><div className="settings-toggle-description">Admin must approve reviews</div></div><ToggleSwitch checked={settings.requireApproval} onChange={(c) => setSettings({ ...settings, requireApproval: c })} /></div>
                    {settings.requireApproval && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Approve High Ratings</div></div><ToggleSwitch checked={settings.autoApprove} onChange={(c) => setSettings({ ...settings, autoApprove: c })} /></div>
                        {settings.autoApprove && <SettingsField label="Minimum Rating to Auto-Approve"><AdminDropdown value={String(settings.autoApproveMinRating)} onChange={(v) => setSettings({ ...settings, autoApproveMinRating: Number(v) })} options={[{ value: '3', label: '3+ stars' }, { value: '4', label: '4+ stars' }, { value: '5', label: '5 stars only' }]} /></SettingsField>}
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'display' && (
                <SettingsSection title="Display Settings" description="How reviews appear" icon="👁️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Star Ratings</div></div><ToggleSwitch checked={settings.showRatings} onChange={(c) => setSettings({ ...settings, showRatings: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Review Count</div></div><ToggleSwitch checked={settings.showReviewCount} onChange={(c) => setSettings({ ...settings, showReviewCount: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Average Rating</div></div><ToggleSwitch checked={settings.showAverageRating} onChange={(c) => setSettings({ ...settings, showAverageRating: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Review Date</div></div><ToggleSwitch checked={settings.showReviewDate} onChange={(c) => setSettings({ ...settings, showReviewDate: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Verified Badge</div><div className="settings-toggle-description">Mark verified purchases</div></div><ToggleSwitch checked={settings.showVerifiedBadge} onChange={(c) => setSettings({ ...settings, showVerifiedBadge: c })} /></div>
                    <div className="settings-grid">
                        <SettingsField label="Default Sort"><AdminDropdown value={settings.sortBy} onChange={(v) => setSettings({ ...settings, sortBy: v })} options={[{ value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' }, { value: 'highest', label: 'Highest Rated' }, { value: 'lowest', label: 'Lowest Rated' }, { value: 'helpful', label: 'Most Helpful' }]} /></SettingsField>
                        <SettingsField label="Reviews Per Page"><input type="number" value={settings.reviewsPerPage} onChange={(e) => setSettings({ ...settings, reviewsPerPage: Number(e.target.value) })} min={5} max={50} /></SettingsField>
                    </div>
                </SettingsSection>
            )}

            {activeTab === 'content' && (
                <SettingsSection title="Review Content" description="What reviews can contain" icon="📝">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Photo Uploads</div></div><ToggleSwitch checked={settings.allowPhotos} onChange={(c) => setSettings({ ...settings, allowPhotos: c })} /></div>
                    {settings.allowPhotos && <SettingsField label="Max Photos Per Review"><input type="number" value={settings.maxPhotosPerReview} onChange={(e) => setSettings({ ...settings, maxPhotosPerReview: Number(e.target.value) })} min={1} max={10} style={{ maxWidth: '80px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Video Uploads</div></div><ToggleSwitch checked={settings.allowVideos} onChange={(c) => setSettings({ ...settings, allowVideos: c })} /></div>
                    <div className="settings-grid">
                        <SettingsField label="Min Review Length (chars)"><input type="number" value={settings.minReviewLength} onChange={(e) => setSettings({ ...settings, minReviewLength: Number(e.target.value) })} min={0} max={500} /></SettingsField>
                        <SettingsField label="Max Review Length (chars)"><input type="number" value={settings.maxReviewLength} onChange={(e) => setSettings({ ...settings, maxReviewLength: Number(e.target.value) })} min={100} max={10000} /></SettingsField>
                    </div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Review Title</div></div><ToggleSwitch checked={settings.enableTitle} onChange={(c) => setSettings({ ...settings, enableTitle: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Pros & Cons</div></div><ToggleSwitch checked={settings.enableProsAndCons} onChange={(c) => setSettings({ ...settings, enableProsAndCons: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'rating' && (
                <SettingsSection title="Rating Configuration" description="Star rating options" icon="🌟">
                    <SettingsField label="Rating Scale"><AdminDropdown value={String(settings.ratingScale)} onChange={(v) => setSettings({ ...settings, ratingScale: Number(v) })} options={[{ value: '5', label: '5 Stars' }, { value: '10', label: '10 Stars' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Half Stars</div><div className="settings-toggle-description">Allow .5 ratings display</div></div><ToggleSwitch checked={settings.showHalfStars} onChange={(c) => setSettings({ ...settings, showHalfStars: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Criteria Rating</div><div className="settings-toggle-description">Rate different aspects</div></div><ToggleSwitch checked={settings.enableCriteriaRating} onChange={(c) => setSettings({ ...settings, enableCriteriaRating: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'notifications' && (
                <SettingsSection title="Review Notifications" description="Email alerts for reviews" icon="🔔">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Notify Admin on New Review</div></div><ToggleSwitch checked={settings.notifyAdminNewReview} onChange={(c) => setSettings({ ...settings, notifyAdminNewReview: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Notify Customer on Approval</div></div><ToggleSwitch checked={settings.notifyCustomerApproved} onChange={(c) => setSettings({ ...settings, notifyCustomerApproved: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Notify Customer on Rejection</div></div><ToggleSwitch checked={settings.notifyCustomerRejected} onChange={(c) => setSettings({ ...settings, notifyCustomerRejected: c })} /></div>
                    <SettingsField label="Ask for Review After (days)" description="Days after delivery"><input type="number" value={settings.askForReviewAfterDays} onChange={(e) => setSettings({ ...settings, askForReviewAfterDays: Number(e.target.value) })} min={1} max={30} style={{ maxWidth: '100px' }} /></SettingsField>
                </SettingsSection>
            )}

            {activeTab === 'spam' && (
                <SettingsSection title="Spam Protection" description="Prevent fake reviews" icon="🛡️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">One Review Per Product</div><div className="settings-toggle-description">Prevent duplicate reviews</div></div><ToggleSwitch checked={settings.oneReviewPerProduct} onChange={(c) => setSettings({ ...settings, oneReviewPerProduct: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable CAPTCHA</div></div><ToggleSwitch checked={settings.enableCaptcha} onChange={(c) => setSettings({ ...settings, enableCaptcha: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Block Banned Words</div></div><ToggleSwitch checked={settings.blockBannedWords} onChange={(c) => setSettings({ ...settings, blockBannedWords: c })} /></div>
                    {settings.blockBannedWords && <SettingsField label="Banned Words" description="Comma-separated list"><textarea value={settings.bannedWords} onChange={(e) => setSettings({ ...settings, bannedWords: e.target.value })} rows={3} placeholder="spam, fake, test..." /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Verified Email</div></div><ToggleSwitch checked={settings.requireVerifiedEmail} onChange={(c) => setSettings({ ...settings, requireVerifiedEmail: c })} /></div>
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-outline" onClick={() => { setSettings(defaultSettings); toast.info('Settings reset to default values'); }} type="button">Reset to Default</button><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
