'use client';

import { useEffect, useState } from 'react';

type KillSwitchConfig = {
  maxOrdersPerDay: number;
  maxCodValue: number;
  maxDiscountPercent: number;
  maxOrderValue: number;
  blockNewCustomerCod: boolean;
  blockHighRiskAreas: boolean;
  requireApprovalAbove: number;
  flagCustomerReturnThreshold: number;
};

const defaultConfig: KillSwitchConfig = {
  maxOrdersPerDay: 1000,
  maxCodValue: 5000,
  maxDiscountPercent: 50,
  maxOrderValue: 50000,
  blockNewCustomerCod: false,
  blockHighRiskAreas: false,
  requireApprovalAbove: 10000,
  flagCustomerReturnThreshold: 3,
};

export default function KillSwitchesPage() {
  const [config, setConfig] = useState<KillSwitchConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      try {
        const res = await fetch('/api/admin/config/kill-switches');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setConfig({ ...defaultConfig, ...data });
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    })();
    
    return () => { cancelled = true; };
  }, []);

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch('/api/admin/config/kill-switches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">مفاتيح الأمان</h1>
          <p className="text-gray-500">Kill Switches - حماية متقدمة للنظام</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="admin-btn admin-btn-primary"
        >
          {saving ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Order Limits */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>📦</span>
          حدود الطلبات
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput
            label="الحد الأقصى للطلبات يومياً"
            value={config.maxOrdersPerDay}
            onChange={v => setConfig({ ...config, maxOrdersPerDay: v })}
            icon="📊"
            hint="سيتوقف النظام عن قبول طلبات جديدة بعد هذا العدد"
          />
          
          <NumberInput
            label="الحد الأقصى لقيمة الطلب الواحد"
            value={config.maxOrderValue}
            onChange={v => setConfig({ ...config, maxOrderValue: v })}
            icon="💰"
            suffix="ج.م"
            hint="الطلبات أعلى من هذا تحتاج موافقة"
          />
        </div>
      </div>

      {/* COD Limits */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>💵</span>
          حدود الدفع عند الاستلام (COD)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput
            label="الحد الأقصى لقيمة COD"
            value={config.maxCodValue}
            onChange={v => setConfig({ ...config, maxCodValue: v })}
            icon="💳"
            suffix="ج.م"
            hint="الطلبات COD أعلى من هذا تُرفض أو تحتاج موافقة"
          />
          
          <ToggleInput
            label="حظر COD للعملاء الجدد"
            value={config.blockNewCustomerCod}
            onChange={v => setConfig({ ...config, blockNewCustomerCod: v })}
            icon="👤"
            hint="العملاء الجدد يجب الدفع إلكتروني"
          />
        </div>
      </div>

      {/* Discount Limits */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>🏷️</span>
          حدود الخصومات
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NumberInput
            label="الحد الأقصى لنسبة الخصم"
            value={config.maxDiscountPercent}
            onChange={v => setConfig({ ...config, maxDiscountPercent: v })}
            icon="📉"
            suffix="%"
            hint="لا يمكن إنشاء كوبون خصم أعلى من هذا"
          />
          
          <NumberInput
            label="موافقة مطلوبة لقيمة أعلى من"
            value={config.requireApprovalAbove}
            onChange={v => setConfig({ ...config, requireApprovalAbove: v })}
            icon="✓"
            suffix="ج.م"
            hint="التعديلات على طلبات بهذه القيمة تحتاج موافقة"
          />
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
          <span>⚠️</span>
          إدارة المخاطر
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ToggleInput
            label="حظر المناطق عالية الخطورة"
            value={config.blockHighRiskAreas}
            onChange={v => setConfig({ ...config, blockHighRiskAreas: v })}
            icon="🗺️"
            hint="المناطق المحددة كـ critical في Shipping Zones"
          />
          
          <NumberInput
            label="علَّم العميل بعد عدد مرتجعات"
            value={config.flagCustomerReturnThreshold}
            onChange={v => setConfig({ ...config, flagCustomerReturnThreshold: v })}
            icon="🚩"
            hint="العملاء بهذا العدد أو أكثر يُعلَّمون للمراجعة"
          />
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-sm">
          ⚠️ <strong>تحذير:</strong> تفعيل هذه القيود قد يؤثر على المبيعات. 
          تأكد من فهم تأثير كل إعداد قبل التغيير.
        </p>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  icon,
  suffix,
  hint
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </label>
      <div className="flex">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3c34] focus:border-transparent"
        />
        {suffix && (
          <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function ToggleInput({
  label,
  value,
  onChange,
  icon,
  hint
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </label>
      <button
        onClick={() => onChange(!value)}
        className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
          value 
            ? 'bg-[#1a3c34] border-[#1a3c34] text-white' 
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}
      >
        {value ? '✓ مفعّل' : '✗ غير مفعّل'}
      </button>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
