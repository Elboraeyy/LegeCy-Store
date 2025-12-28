"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import SettingsSection from '@/components/admin/settings/SettingsSection';
import SettingsField from '@/components/admin/settings/SettingsField';
import ToggleSwitch from '@/components/admin/settings/ToggleSwitch';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

type OrdersSettings = {
    orderPrefix: string;
    orderSuffix: string;
    orderStartNumber: number;
    padOrderNumber: boolean;
    orderNumberLength: number;
    defaultOrderStatus: string;
    autoCompleteOrders: boolean;
    autoCompleteAfterDays: number;
    allowOrderCancellation: boolean;
    cancellationTimeLimit: number;
    enableGuestCheckout: boolean;
    requirePhone: boolean;
    requireEmail: boolean;
    enableOrderNotes: boolean;
    enableGiftMessage: boolean;
    cartExpirationHours: number;
    enableSaveForLater: boolean;
    maxQuantityPerItem: number;
    enableMinimumOrder: boolean;
    minimumOrderAmount: number;
    enableMaximumOrder: boolean;
    maximumOrderAmount: number;
    sendOrderConfirmation: boolean;
    showEstimatedDelivery: boolean;
    enableOrderTracking: boolean;
    enableInvoices: boolean;
    autoGenerateInvoice: boolean;
    invoicePrefix: string;
    enableReturns: boolean;
    returnWindowDays: number;
    requireReturnReason: boolean;
    enableExchanges: boolean;
    refundToOriginalPayment: boolean;
    enableStoreCredit: boolean;
};

const defaultSettings: OrdersSettings = {
    orderPrefix: 'ORD-',
    orderSuffix: '',
    orderStartNumber: 1000,
    padOrderNumber: true,
    orderNumberLength: 6,
    defaultOrderStatus: 'pending',
    autoCompleteOrders: false,
    autoCompleteAfterDays: 14,
    allowOrderCancellation: true,
    cancellationTimeLimit: 24,
    enableGuestCheckout: true,
    requirePhone: true,
    requireEmail: true,
    enableOrderNotes: true,
    enableGiftMessage: false,
    cartExpirationHours: 72,
    enableSaveForLater: true,
    maxQuantityPerItem: 10,
    enableMinimumOrder: false,
    minimumOrderAmount: 100,
    enableMaximumOrder: false,
    maximumOrderAmount: 10000,
    sendOrderConfirmation: true,
    showEstimatedDelivery: true,
    enableOrderTracking: true,
    enableInvoices: true,
    autoGenerateInvoice: true,
    invoicePrefix: 'INV-',
    enableReturns: true,
    returnWindowDays: 14,
    requireReturnReason: true,
    enableExchanges: true,
    refundToOriginalPayment: true,
    enableStoreCredit: true,
};

export default function OrdersSettingsPage() {
    const [settings, setSettings] = useState<OrdersSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('numbers');

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getStoreConfig('orders_settings');
                if (data) setSettings({ ...defaultSettings, ...(data as Partial<OrdersSettings>) });
            } catch { console.error('Failed to load settings'); } 
            finally { setLoading(false); }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreConfig('orders_settings', settings);
            toast.success('Orders settings saved!');
        } catch { toast.error('Failed to save settings'); } 
        finally { setSaving(false); }
    };

    const tabs = [
        { id: 'numbers', label: 'Order Numbers', icon: '#️⃣' },
        { id: 'status', label: 'Status', icon: '🚦' },
        { id: 'checkout', label: 'Checkout', icon: '🛒' },
        { id: 'cart', label: 'Cart', icon: '🧺' },
        { id: 'invoices', label: 'Invoices', icon: '🧾' },
        { id: 'returns', label: 'Returns', icon: '↩️' },
    ];

    if (loading) return <div className="settings-loading"><div className="skeleton" style={{ height: '400px', borderRadius: '20px' }} /></div>;

    return (
        <div>
            <div className="settings-page-header">
                <h1 className="settings-page-title">Orders & Checkout</h1>
                <p className="settings-page-description">Order processing, checkout, and returns (45+ options)</p>
            </div>

            <div className="settings-tabs">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}>
                        <span>{tab.icon}</span><span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'numbers' && (
                <SettingsSection title="Order Number Format" description="How order numbers are generated" icon="#️⃣">
                    <div className="settings-grid settings-grid-3">
                        <SettingsField label="Order Prefix"><input type="text" value={settings.orderPrefix} onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })} /></SettingsField>
                        <SettingsField label="Order Suffix"><input type="text" value={settings.orderSuffix} onChange={(e) => setSettings({ ...settings, orderSuffix: e.target.value })} /></SettingsField>
                        <SettingsField label="Start Number"><input type="number" value={settings.orderStartNumber} onChange={(e) => setSettings({ ...settings, orderStartNumber: Number(e.target.value) })} min={1} /></SettingsField>
                    </div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Pad Order Number</div><div className="settings-toggle-description">Add leading zeros</div></div><ToggleSwitch checked={settings.padOrderNumber} onChange={(c) => setSettings({ ...settings, padOrderNumber: c })} /></div>
                    {settings.padOrderNumber && <SettingsField label="Number Length"><input type="number" value={settings.orderNumberLength} onChange={(e) => setSettings({ ...settings, orderNumberLength: Number(e.target.value) })} min={4} max={12} style={{ maxWidth: '100px' }} /></SettingsField>}
                    <div style={{ padding: '16px', background: 'var(--admin-surface-light)', borderRadius: '12px', marginTop: '16px' }}><strong>Preview:</strong> {settings.orderPrefix}{settings.padOrderNumber ? String(settings.orderStartNumber).padStart(settings.orderNumberLength, '0') : settings.orderStartNumber}{settings.orderSuffix}</div>
                </SettingsSection>
            )}

            {activeTab === 'status' && (
                <SettingsSection title="Order Status" description="Default status and automation" icon="🚦">
                    <SettingsField label="Default Order Status"><AdminDropdown value={settings.defaultOrderStatus} onChange={(v) => setSettings({ ...settings, defaultOrderStatus: v })} options={[{ value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'confirmed', label: 'Confirmed' }]} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Complete Orders</div></div><ToggleSwitch checked={settings.autoCompleteOrders} onChange={(c) => setSettings({ ...settings, autoCompleteOrders: c })} /></div>
                    {settings.autoCompleteOrders && <SettingsField label="Days After Delivery"><input type="number" value={settings.autoCompleteAfterDays} onChange={(e) => setSettings({ ...settings, autoCompleteAfterDays: Number(e.target.value) })} min={1} max={60} style={{ maxWidth: '100px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Allow Order Cancellation</div></div><ToggleSwitch checked={settings.allowOrderCancellation} onChange={(c) => setSettings({ ...settings, allowOrderCancellation: c })} /></div>
                    {settings.allowOrderCancellation && <SettingsField label="Cancellation Time Limit (hours)"><input type="number" value={settings.cancellationTimeLimit} onChange={(e) => setSettings({ ...settings, cancellationTimeLimit: Number(e.target.value) })} min={1} max={168} style={{ maxWidth: '100px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'checkout' && (
                <SettingsSection title="Checkout Settings" description="Checkout form and options" icon="🛒">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Guest Checkout</div></div><ToggleSwitch checked={settings.enableGuestCheckout} onChange={(c) => setSettings({ ...settings, enableGuestCheckout: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Phone Number</div></div><ToggleSwitch checked={settings.requirePhone} onChange={(c) => setSettings({ ...settings, requirePhone: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Email</div></div><ToggleSwitch checked={settings.requireEmail} onChange={(c) => setSettings({ ...settings, requireEmail: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Order Notes</div></div><ToggleSwitch checked={settings.enableOrderNotes} onChange={(c) => setSettings({ ...settings, enableOrderNotes: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Gift Message</div></div><ToggleSwitch checked={settings.enableGiftMessage} onChange={(c) => setSettings({ ...settings, enableGiftMessage: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Send Order Confirmation</div></div><ToggleSwitch checked={settings.sendOrderConfirmation} onChange={(c) => setSettings({ ...settings, sendOrderConfirmation: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Show Estimated Delivery</div></div><ToggleSwitch checked={settings.showEstimatedDelivery} onChange={(c) => setSettings({ ...settings, showEstimatedDelivery: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Order Tracking</div></div><ToggleSwitch checked={settings.enableOrderTracking} onChange={(c) => setSettings({ ...settings, enableOrderTracking: c })} /></div>
                </SettingsSection>
            )}

            {activeTab === 'cart' && (
                <SettingsSection title="Cart Settings" description="Shopping cart behavior" icon="🧺">
                    <SettingsField label="Cart Expiration (hours)"><input type="number" value={settings.cartExpirationHours} onChange={(e) => setSettings({ ...settings, cartExpirationHours: Number(e.target.value) })} min={1} max={720} style={{ maxWidth: '100px' }} /></SettingsField>
                    <SettingsField label="Max Quantity Per Item"><input type="number" value={settings.maxQuantityPerItem} onChange={(e) => setSettings({ ...settings, maxQuantityPerItem: Number(e.target.value) })} min={1} max={100} style={{ maxWidth: '100px' }} /></SettingsField>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Save for Later</div></div><ToggleSwitch checked={settings.enableSaveForLater} onChange={(c) => setSettings({ ...settings, enableSaveForLater: c })} /></div>
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Minimum Order</div></div><ToggleSwitch checked={settings.enableMinimumOrder} onChange={(c) => setSettings({ ...settings, enableMinimumOrder: c })} /></div>
                    {settings.enableMinimumOrder && <SettingsField label="Minimum Amount"><input type="number" value={settings.minimumOrderAmount} onChange={(e) => setSettings({ ...settings, minimumOrderAmount: Number(e.target.value) })} min={0} style={{ maxWidth: '150px' }} /></SettingsField>}
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Maximum Order</div></div><ToggleSwitch checked={settings.enableMaximumOrder} onChange={(c) => setSettings({ ...settings, enableMaximumOrder: c })} /></div>
                    {settings.enableMaximumOrder && <SettingsField label="Maximum Amount"><input type="number" value={settings.maximumOrderAmount} onChange={(e) => setSettings({ ...settings, maximumOrderAmount: Number(e.target.value) })} min={0} style={{ maxWidth: '150px' }} /></SettingsField>}
                </SettingsSection>
            )}

            {activeTab === 'invoices' && (
                <SettingsSection title="Invoice Settings" description="Invoice generation" icon="🧾">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Invoices</div></div><ToggleSwitch checked={settings.enableInvoices} onChange={(c) => setSettings({ ...settings, enableInvoices: c })} /></div>
                    {settings.enableInvoices && (<>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Auto-Generate Invoice</div></div><ToggleSwitch checked={settings.autoGenerateInvoice} onChange={(c) => setSettings({ ...settings, autoGenerateInvoice: c })} /></div>
                        <SettingsField label="Invoice Prefix"><input type="text" value={settings.invoicePrefix} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} style={{ maxWidth: '150px' }} /></SettingsField>
                    </>)}
                </SettingsSection>
            )}

            {activeTab === 'returns' && (
                <SettingsSection title="Returns & Refunds" description="Return policy settings" icon="↩️">
                    <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Returns</div></div><ToggleSwitch checked={settings.enableReturns} onChange={(c) => setSettings({ ...settings, enableReturns: c })} /></div>
                    {settings.enableReturns && (<>
                        <SettingsField label="Return Window (days)"><input type="number" value={settings.returnWindowDays} onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })} min={1} max={90} style={{ maxWidth: '100px' }} /></SettingsField>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Require Return Reason</div></div><ToggleSwitch checked={settings.requireReturnReason} onChange={(c) => setSettings({ ...settings, requireReturnReason: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Exchanges</div></div><ToggleSwitch checked={settings.enableExchanges} onChange={(c) => setSettings({ ...settings, enableExchanges: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Refund to Original Payment</div></div><ToggleSwitch checked={settings.refundToOriginalPayment} onChange={(c) => setSettings({ ...settings, refundToOriginalPayment: c })} /></div>
                        <div className="settings-toggle-row"><div className="settings-toggle-info"><div className="settings-toggle-label">Enable Store Credit</div></div><ToggleSwitch checked={settings.enableStoreCredit} onChange={(c) => setSettings({ ...settings, enableStoreCredit: c })} /></div>
                    </>)}
                </SettingsSection>
            )}

            <div className="settings-actions"><button className="admin-btn admin-btn-outline" onClick={() => { setSettings(defaultSettings); toast.info('Settings reset to default values'); }} type="button">Reset to Default</button><button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
