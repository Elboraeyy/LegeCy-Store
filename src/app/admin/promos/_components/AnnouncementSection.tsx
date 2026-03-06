'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getStoreConfig, updateStoreConfig, HeaderSettings } from '@/lib/actions/config';
import { useLanguage } from '@/context/LanguageContext';

export default function AnnouncementSection() {
    const { language } = useLanguage();
    const isRtl = language === 'ar';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [headerConfig, setHeaderConfig] = useState<Partial<HeaderSettings>>({});

    // Settings State
    const [enabled, setEnabled] = useState(false);
    const [text, setText] = useState('');
    const [bgColor, setBgColor] = useState('#12403C');
    const [textColor, setTextColor] = useState('#ffffff');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const config = await getStoreConfig('header_settings');
                if (config && typeof config === 'object') {
                    const parsed = config as Partial<HeaderSettings>;
                    setHeaderConfig(parsed);
                    if (parsed.announcementEnabled !== undefined) setEnabled(parsed.announcementEnabled);
                    if (parsed.announcementText) setText(parsed.announcementText);
                    if (parsed.announcementBgColor) setBgColor(parsed.announcementBgColor);
                    if (parsed.announcementTextColor) setTextColor(parsed.announcementTextColor);
                }
            } catch (error) {
                console.error('Failed to load announcement settings:', error);
                toast.error(isRtl ? 'حدث خطأ أثناء تحميل الإعدادات' : 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [isRtl]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedConfig = {
                ...headerConfig,
                announcementEnabled: enabled,
                announcementText: text,
                announcementBgColor: bgColor,
                announcementTextColor: textColor,
            };

            await updateStoreConfig('header_settings', updatedConfig);
            toast.success(isRtl ? 'تم حفظ التعديلات بنجاح' : 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save announcement settings:', error);
            toast.error(isRtl ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-card p-6 flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="admin-card mb-8 p-6 bg-white rounded-xl shadow-sm border border-[rgba(18,64,60,0.08)]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#12403C]/5 flex items-center justify-center text-xl">📢</div>
                    <div>
                        <h3 className="text-lg font-bold text-[#12403C]">
                            {isRtl ? 'شريط الإعلانات' : 'Announcement Bar'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isRtl ? 'التحكم بالشريط الإعلاني أعلى الموقع' : 'Manage the announcement bar at the top of the storefront'}
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

            <div className="grid md:grid-cols-2 gap-8">
                {/* Enable / Disable Toggle */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 md:col-span-2">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-[#12403C] mb-1">
                            {isRtl ? 'تفعيل الشريط الإعلاني' : 'Enable Announcement Bar'}
                        </label>
                        <p className="text-xs text-gray-500">
                            {isRtl ? 'عرض أو إخفاء الشريط لجميع زوار المتجر' : 'Show or hide the warning to all store visitors'}
                        </p>
                    </div>
                    <div
                        className="relative w-12 h-7 bg-gray-200 rounded-full cursor-pointer transition-colors"
                        style={{ backgroundColor: enabled ? '#12403C' : '#e5e7eb' }}
                        onClick={() => setEnabled(!enabled)}
                    >
                        <div
                            className="absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform"
                            style={{ transform: enabled ? (isRtl ? 'translateX(-20px)' : 'translateX(20px)') : 'translateX(0)' }}
                        />
                    </div>
                </div>

                {/* Text Content */}
                <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-[#12403C]">
                        {isRtl ? 'نص الإعلان' : 'Announcement Text'}
                    </label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isRtl ? 'مثال: خصم 20% على جميع المنتجات!' : 'e.g. 20% off all items!'}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                    />
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#12403C]">
                        {isRtl ? 'لون الخلفية' : 'Background Color'}
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg uppercase font-mono text-sm focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                        />
                    </div>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#12403C]">
                        {isRtl ? 'لون النص' : 'Text Color'}
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg uppercase font-mono text-sm focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] outline-none"
                        />
                    </div>
                </div>

                {/* Live Preview */}
                <div className="md:col-span-2 mt-4 space-y-2">
                    <label className="block text-sm font-semibold text-[#12403C]">
                        {isRtl ? 'معاينة مباشرة' : 'Live Preview'}
                    </label>
                    <div
                        className="w-full py-2 text-center text-xs font-medium tracking-wider uppercase rounded overflow-hidden"
                        style={{
                            backgroundColor: bgColor || "#12403C",
                            color: textColor || "#ffffff",
                        }}
                    >
                        <div className="container mx-auto px-4 truncate">
                            {text || (isRtl ? 'نص الإعلان هنا...' : 'Your announcement text here...')}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
