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
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  function downloadCSV() {
    if (!reportData) return;
    
    let csv = 'LegaCy Board Report\n';
    csv += `Generated: ${reportData.generatedAt.toLocaleString('en-US')}\n\n`;
    
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#12403C]">Board Report</h1>
          <p className="text-gray-500">Comprehensive executive summary in one click</p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="px-4 py-2 bg-[#12403C] text-white rounded-lg font-medium hover:bg-[#0e3330] transition-colors disabled:opacity-50"
        >
          {generating ? 'Loading...' : '📊 Generate Report'}
        </button>
      </div>

      {!reportData && !generating && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <span className="text-5xl">📋</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">Click &ldquo;Generate Report&rdquo;</h3>
          <p className="text-gray-500 mt-2">All financial and partnership data will be compiled</p>
        </div>
      )}

      {generating && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12403C] mx-auto"></div>
          <p className="text-gray-500 mt-4">Compiling data...</p>
        </div>
      )}

      {reportData && (
        <>
          {/* Export Buttons */}
          <div className="flex gap-3 print:hidden">
            <button 
              onClick={downloadCSV} 
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📥 Download CSV
            </button>
            <button 
              onClick={printReport} 
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              🖨️ Print / PDF
            </button>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm print:shadow-none print:border-0">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b">
              <h2 className="text-3xl font-bold text-[#12403C]">LegaCy</h2>
              <p className="text-gray-500">Board Executive Report</p>
              <p className="text-sm text-gray-400 mt-2">
                Generated: {reportData.generatedAt.toLocaleString('en-US')}
              </p>
            </div>

            {/* Financial Summary */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#12403C] mb-4 flex items-center gap-2">
                <span>💰</span>
                Financial Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ReportStat label="Current Cash" value={formatCurrency(reportData.cashFlow.currentCash)} />
                <ReportStat label="Monthly Revenue" value={formatCurrency(reportData.cashFlow.monthlyRevenue)} />
                <ReportStat label="Monthly Expenses" value={formatCurrency(reportData.cashFlow.monthlyBurnRate)} />
                <ReportStat label="Runway" value={`${reportData.cashFlow.runway.toFixed(1)} months`} />
              </div>
            </section>

            {/* Profit Quality */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#12403C] mb-4 flex items-center gap-2">
                <span>📊</span>
                Profit Quality
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
                    {reportData.profitQuality.score >= 70 ? 'Good' : 
                     reportData.profitQuality.score >= 50 ? 'Average' : 'Needs Improvement'}
                  </p>
                  <p className="text-gray-500">
                    Trend: {reportData.profitQuality.trend === 'improving' ? '📈 Improving' :
                             reportData.profitQuality.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                  </p>
                </div>
              </div>
            </section>

            {/* Partners */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-[#12403C] mb-4 flex items-center gap-2">
                <span>🤝</span>
                Partners ({reportData.partners.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-center py-3 px-4">Share</th>
                      <th className="text-right py-3 px-4">Capital</th>
                      <th className="text-right py-3 px-4">Earnings</th>
                      <th className="text-right py-3 px-4">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.partners.map((partner, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{partner.name}</td>
                        <td className="text-center py-3 px-4">{partner.sharePercent.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4">{formatCurrency(partner.capitalContributed)}</td>
                        <td className="text-right py-3 px-4 text-green-600">{formatCurrency(partner.totalEarnings)}</td>
                        <td className="text-right py-3 px-4 font-semibold">{formatCurrency(partner.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center pt-6 border-t text-gray-400 text-sm">
              <p>Automated Report - Generated by LegaCy Admin System</p>
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
      <p className="text-xl font-bold text-[#12403C]">{value}</p>
    </div>
  );
}
