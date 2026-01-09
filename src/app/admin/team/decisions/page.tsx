'use client';

import { useEffect, useState } from 'react';
import { getDecisions, logDecision, getPendingEvaluations } from '@/lib/services/governanceService';

type Decision = {
  id: string;
  type: string;
  title: string;
  description: string;
  contextData: Record<string, unknown>;
  expectedOutcome?: string;
  actualOutcome?: string;
  outcomeScore?: number;
  decisionMakerName?: string;
  evaluatedAt?: Date;
  createdAt: Date;
};

export default function DecisionLogPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pendingEval, setPendingEval] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const filterOptions = filter === 'all' ? {} : { type: filter as 'pricing' | 'marketing' | 'inventory' | 'partnership' | 'operations' };
        const data = await getDecisions(filterOptions);
        if (!cancelled) setDecisions(data as Decision[]);
        
        const pending = await getPendingEvaluations();
        if (!cancelled) setPendingEval(pending as Decision[]);
      } catch (error) {
        console.error('Failed to load decisions:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, [filter, refetchKey]);

  const refetch = () => setRefetchKey(k => k + 1);

  const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
    pricing: { label: 'تسعير', icon: '💰', color: 'bg-blue-100 text-blue-800' },
    marketing: { label: 'تسويق', icon: '📢', color: 'bg-purple-100 text-purple-800' },
    inventory: { label: 'مخزون', icon: '📦', color: 'bg-green-100 text-green-800' },
    partnership: { label: 'شراكة', icon: '🤝', color: 'bg-amber-100 text-amber-800' },
    operations: { label: 'تشغيل', icon: '⚙️', color: 'bg-gray-100 text-gray-800' },
  };

  const getOutcomeStyle = (score?: number) => {
    if (score === undefined) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'بانتظار التقييم' };
    if (score >= 50) return { bg: 'bg-green-100', text: 'text-green-800', label: 'ناجح' };
    if (score >= 0) return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'متوسط' };
    return { bg: 'bg-red-100', text: 'text-red-800', label: 'فاشل' };
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">سجل القرارات</h1>
          <p className="text-gray-500">Decision Log - تتبع وتقييم القرارات الكبيرة</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="admin-btn admin-btn-primary"
        >
          ➕ قرار جديد
        </button>
      </div>

      {/* Pending Evaluations Alert */}
      {pendingEval.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-medium">
            ⏰ {pendingEval.length} قرار مر عليه أكثر من 30 يوم بدون تقييم
          </p>
        </div>
      )}

      {/* New Decision Form */}
      {showForm && (
        <NewDecisionForm 
          onSave={() => { setShowForm(false); refetch(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all' ? 'bg-[#1a3c34] text-white' : 'bg-white border'
          }`}
        >
          الكل
        </button>
        {Object.entries(typeLabels).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
              filter === key ? 'bg-[#1a3c34] text-white' : 'bg-white border'
            }`}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      {/* Decisions List */}
      {decisions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">📋</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">لا توجد قرارات مسجلة</h3>
          <p className="text-gray-500 mt-2">سجل القرارات الكبيرة لتتبع نتائجها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map(decision => {
            const typeInfo = typeLabels[decision.type] || typeLabels.operations;
            const outcomeInfo = getOutcomeStyle(decision.outcomeScore);
            
            return (
              <div key={decision.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${outcomeInfo.bg} ${outcomeInfo.text}`}>
                        {outcomeInfo.label}
                        {decision.outcomeScore !== undefined && ` (${decision.outcomeScore})`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{decision.title}</h3>
                    <p className="text-gray-600 mt-1">{decision.description}</p>
                    
                    {decision.expectedOutcome && (
                      <p className="text-sm text-blue-600 mt-2">
                        📎 النتيجة المتوقعة: {decision.expectedOutcome}
                      </p>
                    )}
                    
                    {decision.actualOutcome && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ النتيجة الفعلية: {decision.actualOutcome}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-left">
                    <p className="text-sm text-gray-500">{decision.decisionMakerName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(decision.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewDecisionForm({ 
  onSave, 
  onCancel 
}: { 
  onSave: () => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'pricing',
    title: '',
    description: '',
    expectedOutcome: '',
    contextData: '{}'
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await logDecision({
        type: formData.type as 'pricing' | 'marketing' | 'inventory' | 'partnership' | 'operations',
        title: formData.title,
        description: formData.description,
        expectedOutcome: formData.expectedOutcome,
        contextData: JSON.parse(formData.contextData || '{}'),
        decisionMaker: 'current-admin', // Should come from session
        decisionMakerName: 'Admin'
      });
      onSave();
    } catch (error) {
      console.error('Failed to save decision:', error);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-lg">قرار جديد</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">نوع القرار</label>
          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="pricing">💰 تسعير</option>
            <option value="marketing">📢 تسويق</option>
            <option value="inventory">📦 مخزون</option>
            <option value="partnership">🤝 شراكة</option>
            <option value="operations">⚙️ تشغيل</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">عنوان القرار</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">وصف القرار</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">النتيجة المتوقعة</label>
        <input
          type="text"
          value={formData.expectedOutcome}
          onChange={e => setFormData({ ...formData, expectedOutcome: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="مثال: زيادة المبيعات 20%"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="admin-btn admin-btn-primary"
        >
          {saving ? 'جاري الحفظ...' : '✓ حفظ القرار'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="admin-btn admin-btn-secondary"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
