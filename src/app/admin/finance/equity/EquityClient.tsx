'use client';

import { useState, useTransition } from 'react';
import { addCapital, withdrawCapital } from '@/lib/actions/finance';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Investor {
  id: string;
  name: string;
  type: string;
  netContributed: number | string;
  currentShare: number | string;
}

export default function EquityClient({ investors }: { investors: Investor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  
  const [selectedInvestor, setSelectedInvestor] = useState(investors[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalCapital = investors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Generate Conic Gradient
  let currentAngle = 0;
  const pieSegments = investors.map((inv: Investor, idx: number) => {
    const share = Number(inv.currentShare);
    const start = currentAngle;
    const end = currentAngle + share;
    currentAngle = end;
    return `${colors[idx % colors.length]} ${start}% ${end}%`;
  }).join(', ');

  const pieStyle = {
    background: totalCapital > 0 
      ? `conic-gradient(${pieSegments})` 
      : '#e5e7eb',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (mode === 'DEPOSIT') {
            await addCapital(selectedInvestor, Number(amount), description);
        } else {
            await withdrawCapital(selectedInvestor, Number(amount), description);
        }
        setShowModal(false);
        setAmount('');
        setDescription('');
        router.refresh();
      } catch (error) {
        const msg = (error as Error)?.message || 'Error processing transaction';
        alert(msg);
        console.error(error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#12403C]">Capital & Equity</h1>
          <p className="text-gray-500">Manage ownership and equity distribution</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setMode('WITHDRAWAL'); setShowModal(true); }} 
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            - Withdraw
          </button>
          <button 
            onClick={() => { setMode('DEPOSIT'); setShowModal(true); }} 
            className="px-4 py-2 bg-[#12403C] text-white rounded-lg font-medium hover:bg-[#0e3330] transition-colors"
          >
            + Inject Capital
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Capital</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-xl font-bold text-[#12403C]">{formatCurrency(totalCapital)}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Shareholders</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{investors.length}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Largest Holder</span>
            <span className="text-lg">👑</span>
          </div>
          <div className="text-xl font-bold text-purple-600">
            {investors.length > 0 
              ? `${Math.max(...investors.map(i => Number(i.currentShare))).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investors Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#12403C]">Shareholders</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contributed</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ownership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {investors.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      >
                        {inv.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{inv.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900">
                    {formatCurrency(Number(inv.netContributed))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-[#12403C]">
                      {Number(inv.currentShare).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
              {investors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No investors found. Add capital to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Equity Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-[#12403C] mb-6">Ownership Structure</h3>
          
          <div className="flex justify-center mb-6">
            <div 
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                ...pieStyle
              }} 
            />
          </div>

          <div className="space-y-3">
            {investors.map((inv, idx) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  />
                  <span className="text-gray-700">{inv.name}</span>
                </div>
                <span className="font-medium">{Number(inv.currentShare).toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Capital</span>
              <span className="font-bold text-[#12403C]">{formatCurrency(totalCapital)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#12403C] mb-1">
              {mode === 'DEPOSIT' ? 'Inject Capital' : 'Withdraw Capital'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {mode === 'DEPOSIT' 
                ? 'This will increase equity and update ownership percentages.' 
                : 'This will reduce equity and payout cash to the partner.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investor</label>
                <select 
                  value={selectedInvestor}
                  onChange={e => setSelectedInvestor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12403C]/20 focus:border-[#12403C] outline-none"
                  required
                >
                  <option value="">Select Investor</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12403C]/20 focus:border-[#12403C] outline-none"
                  placeholder="e.g. 50000"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#12403C]/20 focus:border-[#12403C] outline-none"
                  placeholder={mode === 'DEPOSIT' ? "e.g. Q1 Injection" : "e.g. Profit Distribution"}
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    mode === 'DEPOSIT' 
                      ? 'bg-[#12403C] text-white hover:bg-[#0e3330]'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isPending ? 'Processing...' : (mode === 'DEPOSIT' ? 'Confirm Injection' : 'Confirm Withdrawal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
