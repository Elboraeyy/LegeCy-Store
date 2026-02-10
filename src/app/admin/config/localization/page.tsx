"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig, LocalizationSettings } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

const defaultSettings: LocalizationSettings = {
    defaultLanguage: 'ar',
    enableRTL: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: 'ar-EG',
    weightUnit: 'kg',
    dimensionUnit: 'cm',
};

const languages = [
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français (French)' },
];

const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2025)' },
];

const numberFormats = [
    { value: 'ar-EG', label: 'Arabic (Egypt) - ١٢٣٬٤٥٦٫٧٨' },
    { value: 'en-US', label: 'English (US) - 123,456.78' },
    { value: 'en-GB', label: 'English (UK) - 123,456.78' },
    { value: 'de-DE', label: 'German - 123.456,78' },
];

export default function LocalizationSettingsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language].settings.localization;
    const [settings, setSettings] = useState<LocalizationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('localization_settings');
                if (data) setSettings(data as LocalizationSettings);
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
            await updateStoreConfig('localization_settings', settings);
            toast.success(t.saved);
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(t.error);
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
                <h1 className="settings-page-title">{t.title}</h1>
                <p className="settings-page-description">
                    {t.description}
                </p>
            </div>

            <SettingsSection
                title={t.language_direction}
                description={t.language_direction_desc}
                icon="🌍"
            >
                <SettingsField
                    label={t.default_language}
                    htmlFor="language"
                >
                    <AdminDropdown
                        value={settings.defaultLanguage}
                        onChange={(v) => setSettings({ ...settings, defaultLanguage: v })}
                        options={languages}
                    />
                </SettingsField>

                <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                        <div className="settings-toggle-label">{t.enable_rtl}</div>
                        <div className="settings-toggle-description">
                            {t.enable_rtl_desc}
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={settings.enableRTL}
                        onChange={(checked) => setSettings({ ...settings, enableRTL: checked })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title={t.date_time}
                description={t.date_time_desc}
                icon="📅"
            >
                <div className="settings-grid">
                    <SettingsField
                        label={t.date_format}
                        htmlFor="dateFormat"
                    >
                        <AdminDropdown
                            value={settings.dateFormat}
                            onChange={(v) => setSettings({ ...settings, dateFormat: v })}
                            options={dateFormats}
                        />
                    </SettingsField>

                    <SettingsField
                        label={t.time_format}
                        htmlFor="timeFormat"
                    >
                        <AdminDropdown
                            value={settings.timeFormat}
                            onChange={(v) => setSettings({ ...settings, timeFormat: v })}
                            options={[
                                { value: '12h', label: '12-hour (3:00 PM)' },
                                { value: '24h', label: '24-hour (15:00)' }
                            ]}
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <SettingsSection
                title={t.numbers_measurements}
                description={t.numbers_measurements_desc}
                icon="📏"
            >
                <SettingsField
                    label={t.number_format}
                    htmlFor="numberFormat"
                >
                    <AdminDropdown
                        value={settings.numberFormat}
                        onChange={(v) => setSettings({ ...settings, numberFormat: v })}
                        options={numberFormats}
                    />
                </SettingsField>

                <div className="settings-grid">
                    <SettingsField
                        label={t.weight_unit}
                        htmlFor="weightUnit"
                    >
                        <AdminDropdown
                            value={settings.weightUnit}
                            onChange={(v) => setSettings({ ...settings, weightUnit: v })}
                            options={[
                                { value: 'kg', label: 'Kilograms (kg)' },
                                { value: 'g', label: 'Grams (g)' },
                                { value: 'lb', label: 'Pounds (lb)' },
                                { value: 'oz', label: 'Ounces (oz)' }
                            ]}
                        />
                    </SettingsField>

                    <SettingsField
                        label={t.dimension_unit}
                        htmlFor="dimensionUnit"
                    >
                        <AdminDropdown
                            value={settings.dimensionUnit}
                            onChange={(v) => setSettings({ ...settings, dimensionUnit: v })}
                            options={[
                                { value: 'cm', label: 'Centimeters (cm)' },
                                { value: 'm', label: 'Meters (m)' },
                                { value: 'in', label: 'Inches (in)' },
                                { value: 'ft', label: 'Feet (ft)' }
                            ]}
                        />
                    </SettingsField>
                </div>
            </SettingsSection>

            <div className="settings-actions">
                <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => {
                        setSettings(defaultSettings);
                        toast.info(t.reset_info);
                    }}
                    type="button"
                >
                    {t.reset_default}
                </button>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? t.saving : t.save_changes}
                </button>
            </div>
        </div>
    );
}
