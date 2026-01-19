'use client';

import { useState } from 'react';
import type { TrialBalanceReport } from '@/lib/services/trialBalanceService';

interface Props {
  report: TrialBalanceReport;
}

export default function TrialBalanceClient({ report }: Props) {
  const [filter, setFilter] = useState<string>('all');

  const filteredEntries = report.entries.filter(entry => {
    if (filter === 'all') return true;
    return entry.accountType.toLowerCase() === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-100 text-blue-700';
      case 'LIABILITY': return 'bg-red-100 text-red-700';
      case 'EQUITY': return 'bg-purple-100 text-purple-700';
      case 'REVENUE': return 'bg-green-100 text-green-700';
      case 'EXPENSE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Filter Tabs */}
      <div className="border-b p-4 flex gap-2">
        {['all', 'asset', 'liability', 'equity', 'revenue', 'expense'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filter === type 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Account Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Debit</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map((entry, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{entry.accountCode}</td>
                <td className="px-6 py-4">{entry.accountName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(entry.accountType)}`}>
                    {entry.accountType}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {entry.debitBalance > 0 ? entry.debitBalance.toFixed(2) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {entry.creditBalance > 0 ? entry.creditBalance.toFixed(2) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-bold">
            <tr>
              <td colSpan={3} className="px-6 py-4">TOTALS</td>
              <td className="px-6 py-4 text-right font-mono text-blue-700">
                {report.totalDebits.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right font-mono text-blue-700">
                {report.totalCredits.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t text-sm text-gray-500 flex justify-between">
        <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
        <span>{filteredEntries.length} accounts shown</span>
      </div>
    </div>
  );
}
