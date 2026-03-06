'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import { useLanguage } from '@/context/LanguageContext';

export interface SitewideOfferSettings {
    enabled: boolean;
    // Tier 1: 3+ items → cheapest free
    tier3Enabled: boolean;
    tier3Label: string;
    // Tier 2: 2 items → 50% off cheapest
    tier2Enabled: boolean;
    tier2DiscountPercent: number;
    tier2Label: string;
    // Tier 3: 1 item → 20% off
    tier1Enabled: boolean;
    tier1DiscountPercent: number;
    tier1Label: string;
}

const defaultSettings: SitewideOfferSettings = {
    enabled: false,
    tier3Enabled: true,
    tier3Label: 'Buy 2 Get 1 Free',
    tier2Enabled: true,
    tier2DiscountPercent: 50,
    tier2Label: 'Buy 1 Get 2nd at 50% OFF',
    tier1Enabled: true,
    tier1DiscountPercent: 20,
    tier1Label: '20% OFF any item',
};

export default function SitewideOfferSection() {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SitewideOfferSettings>(defaultSettings);

    useEffect(() => {
        const load = async () => {
            try {
                const config = await getStoreConfig('sitewide_offer_settings');
                if (config && typeof config === 'object') {
                    setSettings({ ...defaultSettings, ...(config as Partial<SitewideOfferSettings>) });
                }
            } catch (error) {
                console.error('Failed to load sitewide offer settings:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('sitewide_offer_settings', JSON.parse(JSON.stringify(settings)));
            toast.success(isRtl ? 'تم حفظ إعدادات العرض' : 'Offer settings saved');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const update = (key: keyof SitewideOfferSettings, value: unknown) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="admin-card p-6 flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#12403C]"></div>
            </div>
        );
    }

    return (
        <div className="admin-card mb-8 p-6 bg-white rounded-xl shadow-sm border border-[rgba(18,64,60,0.08)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#12403C]/5 flex items-center justify-center text-xl">🎯</div>
                    <div>
                        <h3 className="text-lg font-bold text-[#12403C]">
                            {isRtl ? 'العرض الشامل' : 'Site-Wide Offer'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isRtl ? 'خصم تلقائي يتم تطبيقه عند إتمام الطلب' : 'Automatic discount applied at checkout'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-[#12403C] text-white rounded-lg hover:bg-[#0E3330] transition-colors disabled:opacity-50 font-medium"
                >
                    {saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
            </div>

            <div className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-[#12403C] mb-1">
                            {isRtl ? 'تفعيل العرض الشامل' : 'Enable Site-Wide Offer'}
                        </label>
                        <p className="text-xs text-gray-500">
                            {isRtl ? 'لما يكون مفعل، الخصم بيتطبق تلقائي على كل الأوردرات' : 'When enabled, discount auto-applies to all orders at checkout'}
                        </p>
                    </div>
                    <div
                        className="relative w-12 h-7 rounded-full cursor-pointer transition-colors"
                        style={{ backgroundColor: settings.enabled ? '#12403C' : '#e5e7eb' }}
                        onClick={() => update('enabled', !settings.enabled)}
                    >
                        <div
                            className="absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                            style={{ transform: settings.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                    </div>
                </div>

                {/* Tier 3: Buy 2 Get 1 Free */}
                <div className={`p-5 rounded-xl border-2 transition-all ${settings.tier3Enabled && settings.enabled ? 'border-[#12403C]/20 bg-[#12403C]/[0.02]' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎁</span>
                            <h4 className="font-bold text-[#12403C]">
                                {isRtl ? '3 قطع أو أكتر → الأرخص هدية' : '3+ Items → Cheapest FREE'}
                            </h4>
                        </div>
                        <div
                            className="relative w-10 h-6 rounded-full cursor-pointer transition-colors"
                            style={{ backgroundColor: settings.tier3Enabled ? '#12403C' : '#e5e7eb' }}
                            onClick={() => update('tier3Enabled', !settings.tier3Enabled)}
                        >
                            <div
                                className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                                style={{ transform: settings.tier3Enabled ? 'translateX(16px)' : 'translateX(0)' }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        {isRtl ? 'العميل بيدفع حق أغلى قطعتين والأرخص بتكون مجانية' : 'Customer pays for the 2 most expensive items, cheapest is free'}
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'اسم العرض' : 'Offer Label'}</label>
                        <input
                            type="text"
                            value={settings.tier3Label}
                            onChange={(e) => update('tier3Label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                        />
                    </div>
                </div>

                {/* Tier 2: Buy 1 Get 2nd at 50% */}
                <div className={`p-5 rounded-xl border-2 transition-all ${settings.tier2Enabled && settings.enabled ? 'border-[#12403C]/20 bg-[#12403C]/[0.02]' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏷️</span>
                            <h4 className="font-bold text-[#12403C]">
                                {isRtl ? 'قطعتين → التانية بنص التمن' : '2 Items → 2nd at Half Price'}
                            </h4>
                        </div>
                        <div
                            className="relative w-10 h-6 rounded-full cursor-pointer transition-colors"
                            style={{ backgroundColor: settings.tier2Enabled ? '#12403C' : '#e5e7eb' }}
                            onClick={() => update('tier2Enabled', !settings.tier2Enabled)}
                        >
                            <div
                                className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                                style={{ transform: settings.tier2Enabled ? 'translateX(16px)' : 'translateX(0)' }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        {isRtl ? 'يدفع الأغلى كامل والأرخص بنسبة خصم محددة' : 'Pay full for the most expensive, discount on the cheapest'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'نسبة الخصم على التانية' : 'Discount % on 2nd'}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.tier2DiscountPercent}
                                    onChange={(e) => update('tier2DiscountPercent', Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                                />
                                <span className="text-sm text-gray-500">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'اسم العرض' : 'Offer Label'}</label>
                            <input
                                type="text"
                                value={settings.tier2Label}
                                onChange={(e) => update('tier2Label', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Tier 1: Single item discount */}
                <div className={`p-5 rounded-xl border-2 transition-all ${settings.tier1Enabled && settings.enabled ? 'border-[#12403C]/20 bg-[#12403C]/[0.02]' : 'border-gray-100 bg-gray-50 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <h4 className="font-bold text-[#12403C]">
                                {isRtl ? 'قطعة واحدة → خصم' : '1 Item → Discount'}
                            </h4>
                        </div>
                        <div
                            className="relative w-10 h-6 rounded-full cursor-pointer transition-colors"
                            style={{ backgroundColor: settings.tier1Enabled ? '#12403C' : '#e5e7eb' }}
                            onClick={() => update('tier1Enabled', !settings.tier1Enabled)}
                        >
                            <div
                                className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                                style={{ transform: settings.tier1Enabled ? 'translateX(16px)' : 'translateX(0)' }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                        {isRtl ? 'خصم نسبة معينة على أي قطعة واحدة' : 'Percentage discount on any single item'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'نسبة الخصم' : 'Discount %'}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.tier1DiscountPercent}
                                    onChange={(e) => update('tier1DiscountPercent', Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                                />
                                <span className="text-sm text-gray-500">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{isRtl ? 'اسم العرض' : 'Offer Label'}</label>
                            <input
                                type="text"
                                value={settings.tier1Label}
                                onChange={(e) => update('tier1Label', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Preview */}
                {settings.enabled && (
                    <div className="p-4 rounded-lg bg-[#12403C]/5 border border-[#12403C]/10">
                        <h4 className="text-sm font-bold text-[#12403C] mb-2">{isRtl ? 'ملخص العرض النشط' : 'Active Offer Summary'}</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            {settings.tier3Enabled && (
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {isRtl ? `3+ قطع: الأرخص مجاناً` : `3+ items: Cheapest FREE`}
                                </li>
                            )}
                            {settings.tier2Enabled && (
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {isRtl ? `قطعتين: الأرخص بخصم ${settings.tier2DiscountPercent}%` : `2 items: Cheapest at ${settings.tier2DiscountPercent}% off`}
                                </li>
                            )}
                            {settings.tier1Enabled && (
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {isRtl ? `قطعة: خصم ${settings.tier1DiscountPercent}%` : `1 item: ${settings.tier1DiscountPercent}% off`}
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
