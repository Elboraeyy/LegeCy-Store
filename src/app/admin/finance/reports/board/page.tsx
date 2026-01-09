'use client';

import { useState } from 'react';
import { getCashFlowForecast, getPartnerWallets, getProfitQuality } from '@/lib/services/cashFlowService';

export default function BoardReportPage() {
  const [generating, setGenerating] = useState(false);
  interface ReportData {
    generatedAt: Date;
    cashFlow: {
      currentCash: number;
      monthlyRevenue: number;
      monthlyBurnRate: number;
      runway: number;
    };
    partners: Array<{
      id: string;
      name: string;
      sharePercent: number;
      capitalContributed: number;
      totalEarnings: number;
      remaining: number;
    }>;
    profitQuality: {
      score: number;
      trend: string;
    };
  }
  const [reportData, setReportData] = useState<ReportData | null>(null);

  async function generateReport() {
    setGenerating(true);
    try {
      const [cashFlow, partners, profitQuality] = await Promise.all([
        getCashFlowForecast(30),
        getPartnerWallets(),
        getProfitQuality()
      ]);
      
      setReportData({
        generatedAt: new Date(),
        cashFlow: {
          currentCash: cashFlow.currentCash,
          monthlyRevenue: cashFlow.monthlyRevenue,
          monthlyBurnRate: cashFlow.monthlyBurnRate,
          runway: cashFlow.runway
        },
        partners,
        profitQuality: {
          score: profitQuality.score,
          trend: profitQuality.trend
        }
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
    setGenerating(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  function downloadCSV() {
    if (!reportData) return;
    
    let csv = 'LegaCy Board Report\n';
    csv += `Generated: ${reportData.generatedAt.toLocaleString('ar-EG')}\n\n`;
    
    csv += 'Financial Summary\n';
    csv += `Current Cash,${reportData.cashFlow.currentCash}\n`;
    csv += `Monthly Revenue,${reportData.cashFlow.monthlyRevenue}\n`;
    csv += `Monthly Burn,${reportData.cashFlow.monthlyBurnRate}\n`;
    csv += `Runway (months),${reportData.cashFlow.runway.toFixed(1)}\n`;
    csv += `Profit Quality Score,${reportData.profitQuality.score}\n\n`;
    
    csv += 'Partner Summary\n';
    csv += 'Name,Share %,Capital,Earnings,Remaining\n';
    reportData.partners.forEach(p => {
      csv += `${p.name},${p.sharePercent.toFixed(1)}%,${p.capitalContributed},${p.totalEarnings},${p.remaining}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `board-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1a3c34]">تقرير مجلس الإدارة</h1>
          <p className="text-gray-500">Board Report - تقرير شامل بضغطة واحدة</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="admin-btn admin-btn-primary"
        >
          {generating ? 'جاري التحميل...' : '📊 إنشاء التقرير'}
        </button>
      </div>

      {!reportData && !generating && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">📋</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">اضغط &ldquo;إنشاء التقرير&rdquo;</h3>
          <p className="text-gray-500 mt-2">سيتم تجميع جميع البيانات المالية والشراكات</p>
        </div>
      )}

      {generating && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34] mx-auto"></div>
          <p className="text-gray-500 mt-4">جاري تجميع البيانات...</p>
        </div>
      )}

      {reportData && (
        <>
          {/* Export Buttons */}
          <div className="flex gap-3 print:hidden">
            <button onClick={downloadCSV} className="admin-btn admin-btn-secondary">
              📥 تحميل Excel/CSV
            </button>
            <button onClick={printReport} className="admin-btn admin-btn-secondary">
              🖨️ طباعة PDF
            </button>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm print:shadow-none print:border-0">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b">
              <h2 className="text-3xl font-bold text-[#1a3c34]">LegaCy</h2>
              <p className="text-gray-500">تقرير مجلس الإدارة</p>
              <p className="text-sm text-gray-400 mt-2">
                {reportData.generatedAt.toLocaleString('ar-EG')}
              </p>
            </div>

            {/* Financial Summary */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
                <span>💰</span>
                الملخص المالي
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ReportStat label="السيولة الحالية" value={formatCurrency(reportData.cashFlow.currentCash)} />
                <ReportStat label="الإيراد الشهري" value={formatCurrency(reportData.cashFlow.monthlyRevenue)} />
                <ReportStat label="المصروفات الشهرية" value={formatCurrency(reportData.cashFlow.monthlyBurnRate)} />
                <ReportStat label="Runway" value={`${reportData.cashFlow.runway.toFixed(1)} شهر`} />
              </div>
            </section>

            {/* Profit Quality */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
                <span>📊</span>
                جودة الربح
              </h3>
              <div className="flex items-center gap-6">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ 
                    backgroundColor: reportData.profitQuality.score >= 70 ? '#10b981' : 
                                   reportData.profitQuality.score >= 50 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {reportData.profitQuality.score}
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {reportData.profitQuality.score >= 70 ? 'جيد' : 
                     reportData.profitQuality.score >= 50 ? 'متوسط' : 'يحتاج تحسين'}
                  </p>
                  <p className="text-gray-500">
                    الاتجاه: {reportData.profitQuality.trend === 'improving' ? '📈 في تحسن' :
                             reportData.profitQuality.trend === 'declining' ? '📉 في انخفاض' : '➡️ مستقر'}
                  </p>
                </div>
              </div>
            </section>

            {/* Partners */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#1a3c34] mb-4 flex items-center gap-2">
                <span>🤝</span>
                الشركاء ({reportData.partners.length})
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right py-3 px-4">الاسم</th>
                    <th className="text-center py-3 px-4">الحصة</th>
                    <th className="text-center py-3 px-4">رأس المال</th>
                    <th className="text-center py-3 px-4">الأرباح</th>
                    <th className="text-center py-3 px-4">المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.partners.map((partner, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 px-4 font-medium">{partner.name}</td>
                      <td className="text-center py-3 px-4">{partner.sharePercent.toFixed(1)}%</td>
                      <td className="text-center py-3 px-4">{formatCurrency(partner.capitalContributed)}</td>
                      <td className="text-center py-3 px-4 text-green-600">{formatCurrency(partner.totalEarnings)}</td>
                      <td className="text-center py-3 px-4 font-semibold">{formatCurrency(partner.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Footer */}
            <div className="text-center pt-6 border-t text-gray-400 text-sm">
              <p>هذا التقرير آلي - Generated by LegaCy Admin System</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-[#1a3c34]">{value}</p>
    </div>
  );
}
