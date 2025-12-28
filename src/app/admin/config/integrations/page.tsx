"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import { toast } from 'sonner';

type IntegrationSettings = {
    apiKeys: Array<{
        id: string;
        name: string;
        key: string;
        createdAt: string;
        lastUsed: string | null;
    }>;
    webhooks: Array<{
        id: string;
        url: string;
        events: string[];
        active: boolean;
    }>;
};

const defaultSettings: IntegrationSettings = {
    apiKeys: [],
    webhooks: [],
};

const webhookEvents = [
    { value: 'order.created', label: 'Order Created' },
    { value: 'order.updated', label: 'Order Updated' },
    { value: 'order.completed', label: 'Order Completed' },
    { value: 'order.cancelled', label: 'Order Cancelled' },
    { value: 'product.created', label: 'Product Created' },
    { value: 'product.updated', label: 'Product Updated' },
    { value: 'inventory.low', label: 'Low Inventory Alert' },
];

function generateApiKey(): string {
    return 'lsk_' + Array.from({ length: 32 }, () => 
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
    ).join('');
}

export default function IntegrationsSettingsPage() {
    const [settings, setSettings] = useState<IntegrationSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('integration_settings');
                if (data) setSettings(data as IntegrationSettings);
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
            await updateStoreConfig('integration_settings', settings);
            toast.success('Integration settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const createApiKey = () => {
        if (!newKeyName.trim()) {
            toast.error('Please enter a name for the API key');
            return;
        }

        const newKey = {
            id: crypto.randomUUID(),
            name: newKeyName,
            key: generateApiKey(),
            createdAt: new Date().toISOString(),
            lastUsed: null,
        };

        setSettings({
            ...settings,
            apiKeys: [...settings.apiKeys, newKey],
        });
        setNewKeyName('');
        toast.success('API key created! Copy it now - it won\'t be shown again.');
    };

    const revokeApiKey = (id: string) => {
        setSettings({
            ...settings,
            apiKeys: settings.apiKeys.filter((k) => k.id !== id),
        });
        toast.success('API key revoked');
    };

    const createWebhook = () => {
        if (!newWebhookUrl.trim()) {
            toast.error('Please enter a webhook URL');
            return;
        }

        const newWebhook = {
            id: crypto.randomUUID(),
            url: newWebhookUrl,
            events: newWebhookEvents,
            active: true,
        };

        setSettings({
            ...settings,
            webhooks: [...settings.webhooks, newWebhook],
        });
        setNewWebhookUrl('');
        setNewWebhookEvents([]);
        toast.success('Webhook endpoint added');
    };

    const removeWebhook = (id: string) => {
        setSettings({
            ...settings,
            webhooks: settings.webhooks.filter((w) => w.id !== id),
        });
    };

    const toggleWebhookEvent = (event: string) => {
        if (newWebhookEvents.includes(event)) {
            setNewWebhookEvents(newWebhookEvents.filter((e) => e !== event));
        } else {
            setNewWebhookEvents([...newWebhookEvents, event]);
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
                <h1 className="settings-page-title">Integrations</h1>
                <p className="settings-page-description">
                    Manage API keys and webhook endpoints
                </p>
            </div>

            <SettingsSection
                title="API Keys"
                description="Create keys for external integrations"
                icon="🔑"
            >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="API key name (e.g., Mobile App)"
                        style={{
                            flex: 1,
                            maxWidth: '300px',
                            padding: '12px 16px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 'var(--admin-radius-sm)',
                        }}
                    />
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={createApiKey}
                    >
                        Generate Key
                    </button>
                </div>

                {settings.apiKeys.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {settings.apiKeys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: 'var(--admin-surface-light)',
                                    borderRadius: '12px',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{apiKey.name}</div>
                                    <code style={{
                                        fontSize: '12px',
                                        background: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        color: 'var(--admin-text-muted)',
                                    }}>
                                        {apiKey.key.slice(0, 10)}...{apiKey.key.slice(-4)}
                                    </code>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => revokeApiKey(apiKey.id)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '99px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                        No API keys created yet.
                    </p>
                )}
            </SettingsSection>

            <SettingsSection
                title="Webhooks"
                description="Send real-time notifications to external services"
                icon="🔗"
            >
                <div style={{ marginBottom: '20px' }}>
                    <SettingsField
                        label="Endpoint URL"
                        htmlFor="webhookUrl"
                    >
                        <input
                            id="webhookUrl"
                            type="url"
                            value={newWebhookUrl}
                            onChange={(e) => setNewWebhookUrl(e.target.value)}
                            placeholder="https://your-service.com/webhook"
                        />
                    </SettingsField>

                    <div style={{ marginTop: '12px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px',
                        }}>
                            Events to Listen
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {webhookEvents.map((event) => (
                                <button
                                    key={event.value}
                                    type="button"
                                    onClick={() => toggleWebhookEvent(event.value)}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '99px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        border: newWebhookEvents.includes(event.value)
                                            ? '1px solid var(--admin-bg-dark)'
                                            : '1px solid var(--admin-border)',
                                        background: newWebhookEvents.includes(event.value)
                                            ? 'var(--admin-bg-dark)'
                                            : '#fff',
                                        color: newWebhookEvents.includes(event.value)
                                            ? '#fff'
                                            : 'var(--admin-text-on-light)',
                                    }}
                                >
                                    {event.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={createWebhook}
                        style={{ marginTop: '16px' }}
                    >
                        Add Webhook
                    </button>
                </div>

                {settings.webhooks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {settings.webhooks.map((webhook) => (
                            <div
                                key={webhook.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    background: 'var(--admin-surface-light)',
                                    borderRadius: '12px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 500,
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {webhook.url}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                        {webhook.events.length} events
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeWebhook(webhook.id)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '99px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        marginLeft: '12px',
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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
