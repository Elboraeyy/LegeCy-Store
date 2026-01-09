'use client';

import { useEffect, useState } from 'react';
import { getFlaggedOrders, reviewOrder } from '@/lib/services/operationsService';

type FlaggedOrder = {
  id: string;
  orderId: string;
  score: number;
  factors: Record<string, boolean>;
  flagged: boolean;
  reviewStatus: string;
  createdAt: Date;
};

export default function OrderRiskPage() {
  const [orders, setOrders] = useState<FlaggedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const data = await getFlaggedOrders();
        if (!cancelled) setOrders(data as FlaggedOrder[]);
      } catch (error) {
        console.error('Failed to load flagged orders:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, [refetchKey]);

  const refetch = () => setRefetchKey(k => k + 1);

  async function handleReview(orderId: string, decision: 'approved' | 'blocked') {
    try {
      await reviewOrder(orderId, 'admin', decision);
      refetch();
    } catch (error) {
      console.error('Failed to review order:', error);
    }
  }


  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 50) return 'text-amber-600 bg-amber-100';
    if (score >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const factorLabels: Record<string, { label: string; icon: string }> = {
    newCustomer: { label: 'عميل جديد', icon: '👤' },
    highReturnArea: { label: 'منطقة عالية المرتجع', icon: '📍' },
    cod: { label: 'دفع عند الاستلام', icon: '💵' },
    highValue: { label: 'قيمة عالية', icon: '💰' },
    suspiciousEmail: { label: 'بريد مشبوه', icon: '📧' },
    multipleAddresses: { label: 'عناوين متعددة', icon: '🏠' },
    rushOrder: { label: 'طلب وقت غير عادي', icon: '🌙' },
    previousReturns: { label: 'مرتجعات سابقة', icon: '📦' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">تقييم مخاطر الطلبات</h1>
          <p className="text-gray-500">Order Risk Scoring - رصد الطلبات المشبوهة</p>
        </div>
        <button
          onClick={refetch}
          className="admin-btn admin-btn-secondary"
        >
          🔄 تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="🚨" label="طلبات مُعلَّمة" value={orders.length} color="#ef4444" />
        <StatCard 
          icon="⚠️" 
          label="عالية الخطورة" 
          value={orders.filter(o => o.score >= 70).length} 
          color="#f59e0b" 
        />
        <StatCard 
          icon="⏳" 
          label="بانتظار المراجعة" 
          value={orders.filter(o => o.reviewStatus === 'pending').length} 
          color="#3b82f6" 
        />
        <StatCard 
          icon="✅" 
          label="تمت المراجعة" 
          value={orders.filter(o => o.reviewStatus !== 'pending').length} 
          color="#10b981" 
        />
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">✅</span>
          <h3 className="text-xl font-semibold mt-4 text-green-600">لا توجد طلبات مشبوهة</h3>
          <p className="text-gray-500 mt-2">جميع الطلبات تبدو آمنة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(order.score)}`}>
                      {order.score}
                    </span>
                    <div>
                      <p className="font-semibold">Order #{order.orderId.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(order.factors).map(([key, value]) => (
                      value && factorLabels[key] && (
                        <span 
                          key={key}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 flex items-center gap-1"
                        >
                          {factorLabels[key].icon} {factorLabels[key].label}
                        </span>
                      )
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {order.reviewStatus === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(order.orderId, 'approved')}
                      className="admin-btn admin-btn-success"
                    >
                      ✅ موافقة
                    </button>
                    <button
                      onClick={() => handleReview(order.orderId, 'blocked')}
                      className="admin-btn admin-btn-danger"
                    >
                      ❌ حظر
                    </button>
                  </div>
                )}

                {order.reviewStatus !== 'pending' && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.reviewStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.reviewStatus === 'approved' ? '✅ تمت الموافقة' : '❌ تم الحظر'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risk Scoring Guide */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📐</span>
          كيف يتم حساب النقاط؟
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span>عميل جديد: +15</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>منطقة عالية المرتجع: +25</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💵</span>
            <span>COD: +20</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💰</span>
            <span>قيمة عالية: +15</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📧</span>
            <span>بريد مشبوه: +10</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span>مرتجعات سابقة: +20</span>
          </div>
        </div>
        <p className="mt-4 text-gray-600">
          الطلبات بنتيجة 50+ تُعلَّم للمراجعة تلقائياً
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}
