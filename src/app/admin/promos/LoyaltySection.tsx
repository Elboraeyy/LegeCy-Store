'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getLoyaltySettings, updateLoyaltySettings, getLoyaltyStats, searchUsersForLoyalty, adjustUserPoints } from '@/lib/services/loyaltyService';

// Types
type LoyaltyTab = 'overview' | 'settings' | 'members';

interface Settings {
    enabled: boolean;
    pointsPerEgp: number;
    pointValue: number;
    minRedeemPoints: number;
    minOrderTotal: number;
    couponValidity: number;
}

interface RecentTransaction {
    id: string;
    type: string;
    points: number;
    description: string | null;
    createdAt: Date;
    user: { name: string | null; email: string };
    order: { id: string; totalPrice: number } | null;
}

interface Stats {
    totalPointsInCirculation: number;
    totalPointsRedeemedThisMonth: number;
    activeLoyaltyMembers: number;
    recentTransactions: RecentTransaction[];
    config: Settings;
}

interface LoyaltyMember {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    points: number;
    _count: { orders: number };
}

export default function LoyaltySection() {
    const [activeTab, setActiveTab] = useState<LoyaltyTab>('overview');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [saving, setSaving] = useState(false);

    // Members Search
    const [memberSearch, setMemberSearch] = useState('');
    const [members, setMembers] = useState<LoyaltyMember[]>([]);
    const [searchingMembers, setSearchingMembers] = useState(false);
    const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
    const [adjustPointsValue, setAdjustPointsValue] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsData, statsData] = await Promise.all([
                getLoyaltySettings(),
                getLoyaltyStats()
            ]);
            setSettings(settingsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load loyalty data:', error);
            toast.error('Failed to load loyalty data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await updateLoyaltySettings(settings);
            toast.success('Settings updated successfully');
        } catch {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchMembers = async (query: string) => {
        setMemberSearch(query);
        if (query.length < 2) {
            setMembers([]);
            return;
        }
        setSearchingMembers(true);
        try {
            const results = await searchUsersForLoyalty(query);
            setMembers(results);
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingMembers(false);
        }
    };

    const handleAdjustPoints = async () => {
        if (!selectedMember || !adjustPointsValue || !adjustReason) return;

        try {
            const points = parseInt(adjustPointsValue);
            await adjustUserPoints(selectedMember.id, points, adjustReason);
            toast.success('Points adjusted successfully');
            setSelectedMember(null);
            setAdjustPointsValue('');
            setAdjustReason('');
            // Refresh member list if needed or just close modal
        } catch {
            toast.error('Failed to adjust points');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading loyalty system...</div>;

    return (
        <div className="loyalty-dashboard">
            {/* Header with Global Switch */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Loyalty System</h2>
                    <p className="text-gray-500">Manage points, rewards, and detailed configuration</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${settings?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {settings?.enabled ? 'System Active' : 'System Disabled'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
                {(['overview', 'settings', 'members'] as LoyaltyTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === tab
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Points in Circulation"
                        value={stats.totalPointsInCirculation.toLocaleString()}
                        icon="⭐"
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        title="Redeemed (Month)"
                        value={stats.totalPointsRedeemedThisMonth.toLocaleString()}
                        icon="🎁"
                        color="bg-purple-50 text-purple-600"
                    />
                    <StatCard
                        title="Active Members"
                        value={stats.activeLoyaltyMembers.toLocaleString()}
                        icon="👥"
                        color="bg-green-50 text-green-600"
                    />
                    <StatCard
                        title="Earning Rate"
                        value={`${stats.config.pointsPerEgp} pts/EGP`}
                        icon="⚡"
                        color="bg-orange-50 text-orange-600"
                    />
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && settings && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b">
                        <h3 className="text-lg font-bold">System Configuration</h3>

                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900">Enable System</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-4">Earning Rules</h4>
                                <div className="space-y-4">
                                    <ConfigInput
                                        label="Points per 1 EGP"
                                        desc="How many points user earns for every 1 EGP spent"
                                        value={settings.pointsPerEgp}
                                        onChange={(v) => setSettings({ ...settings, pointsPerEgp: Number(v) })}
                                        step={0.01}
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-700 mb-4">Redemption Rules</h4>
                                <div className="space-y-4">
                                    <ConfigInput
                                        label="Point Value (EGP)"
                                        desc="Value of 1 point in EGP (e.g. 0.1 means 10 points = 1 EGP)"
                                        value={settings.pointValue}
                                        onChange={(v) => setSettings({ ...settings, pointValue: Number(v) })}
                                        step={0.01}
                                    />
                                    <ConfigInput
                                        label="Minimum Redeem Points"
                                        desc="Minimum points required to generate a coupon"
                                        value={settings.minRedeemPoints}
                                        onChange={(v) => setSettings({ ...settings, minRedeemPoints: Number(v) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-4">Restrictions & Validity</h4>
                                <div className="space-y-4">
                                    <ConfigInput
                                        label="Minimum Order Total"
                                        desc="Minimum order amount to earn points (0 for no limit)"
                                        value={settings.minOrderTotal}
                                        onChange={(v) => setSettings({ ...settings, minOrderTotal: Number(v) })}
                                    />
                                    <ConfigInput
                                        label="Coupon Validity (Days)"
                                        desc="How long generated coupons remain valid"
                                        value={settings.couponValidity}
                                        onChange={(v) => setSettings({ ...settings, couponValidity: Number(v) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end">
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold">Members Management</h3>
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            className="bg-white border rounded-lg px-4 py-2 w-80 shadow-sm"
                            value={memberSearch}
                            onChange={(e) => handleSearchMembers(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-center">Points Balance</th>
                                    <th className="px-6 py-4 text-center">Value</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {searchingMembers && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Searching...</td></tr>
                                )}
                                {!searchingMembers && members.length === 0 && memberSearch.length >= 2 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No members found</td></tr>
                                )}
                                {!searchingMembers && members.length === 0 && memberSearch.length < 2 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Start typing to search members...</td></tr>
                                )}
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{member.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">ID: {member.id.substring(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div>{member.email}</div>
                                            <div className="text-sm">{member.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{member.points.toLocaleString()} pts</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            ≈ {(member.points * (settings?.pointValue || 0)).toLocaleString()} EGP
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedMember(member)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                Adjust Points
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Adjust Points Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Adjust Points</h3>
                        <p className="text-gray-600 mb-6">Updating points for <span className="font-semibold text-gray-900">{selectedMember.name}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points Amount (+/-)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="e.g. 500 or -200"
                                    value={adjustPointsValue}
                                    onChange={(e) => setAdjustPointsValue(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Use negative value to deduct points.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="e.g. Manual adjustment, Refund, Bonus"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustPoints}
                                disabled={!adjustPointsValue || !adjustReason}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Confirm Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponents
function StatCard({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold mt-2 text-gray-800">{value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${color}`}>
                {icon}
            </div>
        </div>
    );
}

function ConfigInput({ label, desc, value, onChange, step = 1 }: { label: string, desc: string, value: number, onChange: (v: string) => void, step?: number }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">{label}</label>
            <input
                type="number"
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
        </div>
    );
}
