'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { getExpiryReport, ExpiryBatch } from '@/lib/actions/inventory-reports';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function ExpiryWarningsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();

    const [batches, setBatches] = useState<ExpiryBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getExpiryReport();
                setBatches(data);
            } catch (error) {
                console.error('Failed to load expiry report:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!permLoading && hasPermission('INVENTORY_VIEW')) {
            loadData();
        } else if (!permLoading && !hasPermission('INVENTORY_VIEW')) {
            setLoading(false);
        }
    }, [permLoading, hasPermission]);

    if (permLoading || loading) {
        return <div className="p-8 text-center">{t.inventory.loading || "Loading..."}</div>;
    }

    if (!hasPermission('INVENTORY_VIEW')) {
        return <div className="p-8 text-center text-red-600">{t.inventory.access_denied}</div>;
    }


    // Original code: urgent (<=7), warning (>7 && <=30). Expired is <=0.
    // My server action: EXPIRED (<=0), URGENT (<=7), WARNING (<=30).
    // Original UI: Critical (<=7 days) - which implies expired + urgent.

    const criticalBatches = batches.filter(b => b.status === 'EXPIRED' || b.status === 'URGENT');
    const warningBatches = batches.filter(b => b.status === 'WARNING');

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t.inventory.expiry.title}</h1>
                    <p className="text-gray-500 mt-1">
                        {t.inventory.expiry.subtitle}
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {t.inventory.expiry.critical.replace('{count}', criticalBatches.length.toString())}
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        {t.inventory.expiry.warning.replace('{count}', warningBatches.length.toString())}
                    </span>
                </div>
            </div>

            {batches.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="text-lg font-medium text-green-700">{t.inventory.expiry.no_expiry}</h3>
                    <p className="text-green-600">{t.inventory.expiry.no_expiry_desc}</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.status}</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.product}</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.batch}</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.warehouse}</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.qty}</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.expiry_date}</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">{t.inventory.expiry.table.days_left}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                                {batches.map((batch) => {
                                    const isExpired = batch.status === 'EXPIRED';
                                    const isUrgent = batch.status === 'URGENT';

                                return (
                                    <tr key={batch.id} className={isExpired ? 'bg-red-50' : isUrgent ? 'bg-amber-50' : ''}>
                                        <td className="px-6 py-4">
                                            {isExpired ? (
                                                <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">{t.inventory.expiry.table.expired_status}</span>
                                            ) : isUrgent ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">{t.inventory.expiry.table.urgent_status}</span>
                                            ) : (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">{t.inventory.expiry.table.warning_status}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{batch.productName}</td>
                                        <td className="px-6 py-4 font-mono text-sm">{batch.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">{batch.warehouseName}</td>
                                        <td className="px-6 py-4 text-right font-mono">{batch.remainingQuantity}</td>
                                        <td className="px-6 py-4">
                                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'}`}>
                                                {isExpired
                                                    ? t.inventory.expiry.table.days_ago.replace('{days}', Math.abs(batch.daysLeft).toString())
                                                    : t.inventory.expiry.table.days.replace('{days}', batch.daysLeft.toString())
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
