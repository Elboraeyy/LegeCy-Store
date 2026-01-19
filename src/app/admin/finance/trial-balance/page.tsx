import { generateTrialBalance, getAccountsSummary } from '@/lib/services/trialBalanceService';
import TrialBalanceClient from './TrialBalanceClient';

export const metadata = {
  title: 'Trial Balance | Admin Finance',
  description: 'View trial balance report for financial verification'
};

export default async function TrialBalancePage() {
  const [report, summary] = await Promise.all([
    generateTrialBalance(),
    getAccountsSummary()
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trial Balance</h1>
          <p className="text-gray-500 mt-1">
            Financial verification report - Debits should equal Credits
          </p>
        </div>
        <div className="flex items-center gap-4">
          {report.isBalanced ? (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2">
              <span className="text-lg">✓</span> Balanced
            </span>
          ) : (
            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2">
              <span className="text-lg">⚠</span> Out of Balance: {report.variance.toFixed(2)} EGP
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Assets</p>
          <p className="text-2xl font-bold text-blue-700">{summary.totalAssets.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600">Liabilities</p>
          <p className="text-2xl font-bold text-red-700">{summary.totalLiabilities.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">Equity</p>
          <p className="text-2xl font-bold text-purple-700">{summary.totalEquity.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Revenue</p>
          <p className="text-2xl font-bold text-green-700">{summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600">Expenses</p>
          <p className="text-2xl font-bold text-orange-700">{summary.totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <TrialBalanceClient report={report} />
    </div>
  );
}
