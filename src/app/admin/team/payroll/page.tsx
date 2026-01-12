'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPayrollSummary, paySalary } from '@/lib/actions/employee-management';
import { getVaults, Vault } from '@/lib/actions/treasury';
import Link from 'next/link';

export default function PayrollPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState<{
        totalPaid: number;
        totalEmployees: number;
        payments: Array<{
            employeeId: string;
            employeeName: string;
            netAmount: number;
            paymentDate: Date;
        }>;
        unpaidEmployees: Array<{ id: string; name: string; salary: number }>;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [selectedVaultId, setSelectedVaultId] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        
        const loadData = async () => {
            setLoading(true);
            const [summaryData, vaultsData] = await Promise.all([
                getPayrollSummary(month, year),
                getVaults()
            ]);
            if (!cancelled) {
                setSummary(summaryData);
                setVaults(vaultsData);
                // Set default vault (1001 Cash) only on first load
                if (vaultsData.length > 0) {
                    const defaultVault = vaultsData.find(v => v.code === '1001') || vaultsData[0];
                    setSelectedVaultId(prev => prev || defaultVault.id);
                }
                setLoading(false);
            }
        };
        
        loadData();
        
        return () => { cancelled = true; };
    }, [month, year]);

    const loadSummary = async () => {
        setLoading(true);
        const data = await getPayrollSummary(month, year);
        setSummary(data);
        setLoading(false);
    };

    const handlePayNow = async (emp: { id: string; name: string; salary: number }) => {
        const selectedVault = vaults.find(v => v.id === selectedVaultId);
        const vaultName = selectedVault?.name || 'Cash';
        
        if (!confirm(`Pay ${emp.name} their salary of ${formatCurrency(emp.salary)} from ${vaultName}?`)) return;

        setProcessing(emp.id);
        const result = await paySalary(emp.id, emp.salary, 0, 0, month, year, 'cash', undefined, selectedVaultId);
        setProcessing(null);

        if (result.success) {
            toast.success(`Salary paid to ${emp.name} from ${vaultName}`);
            loadSummary();
        } else {
            toast.error(result.error || 'Failed to process payment');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="payroll-page">
            {/* Header */}
            <div className="payroll-header">
                <div>
                    <h1 className="admin-title">💰 Payroll Management</h1>
                    <p className="admin-subtitle">Process and track employee salary payments</p>
                </div>
                <Link href="/admin/team" className="admin-btn admin-btn-outline">
                    ← Back to Team
                </Link>
            </div>

            {/* Month/Year/Vault Selector */}
            <div className="payroll-filters">
                <div className="filter-group">
                    <label>Month</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="form-input">
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Year</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="form-input">
                        {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>🏦 Pay From Vault</label>
                    <select 
                        value={selectedVaultId} 
                        onChange={e => setSelectedVaultId(e.target.value)} 
                        className="form-input vault-select"
                    >
                        {vaults.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.icon} {v.name} ({formatCurrency(v.balance)})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="payroll-loading">
                    <div className="spinner"></div>
                    <p>Loading payroll...</p>
                </div>
            ) : summary && (
                <>
                    {/* Summary Cards */}
                    <div className="payroll-summary">
                        <div className="admin-card summary-card">
                            <div className="summary-icon">💵</div>
                            <div>
                                <div className="summary-label">Total Paid ({months[month - 1]})</div>
                                <div className="summary-value">{formatCurrency(summary.totalPaid)}</div>
                            </div>
                        </div>
                        <div className="admin-card summary-card">
                            <div className="summary-icon">✅</div>
                            <div>
                                <div className="summary-label">Employees Paid</div>
                                <div className="summary-value">{summary.totalEmployees}</div>
                            </div>
                        </div>
                        <div className="admin-card summary-card pending">
                            <div className="summary-icon">⏳</div>
                            <div>
                                <div className="summary-label">Pending Payments</div>
                                <div className="summary-value">{summary.unpaidEmployees.length}</div>
                            </div>
                        </div>
                        <div className="admin-card summary-card">
                            <div className="summary-icon">💰</div>
                            <div>
                                <div className="summary-label">Pending Amount</div>
                                <div className="summary-value">
                                    {formatCurrency(summary.unpaidEmployees.reduce((sum, e) => sum + e.salary, 0))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unpaid Employees */}
                    {summary.unpaidEmployees.length > 0 && (
                        <div className="admin-card payroll-section">
                            <h3 className="section-title">⏳ Pending Payments</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Salary Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.unpaidEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="employee-name">{emp.name}</div>
                                            </td>
                                            <td>
                                                <div className="salary-amount">{formatCurrency(emp.salary)}</div>
                                            </td>
                                            <td>
                                                <button
                                                    className="admin-btn admin-btn-primary"
                                                    onClick={() => handlePayNow(emp)}
                                                    disabled={processing === emp.id}
                                                >
                                                    {processing === emp.id ? 'Processing...' : 'Pay Now'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paid Employees */}
                    <div className="admin-card payroll-section">
                        <h3 className="section-title">✅ Completed Payments</h3>
                        {summary.payments.length === 0 ? (
                            <div className="no-payments">
                                <p>No payments processed for {months[month - 1]} {year}</p>
                            </div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Amount</th>
                                        <th>Payment Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.payments.map((p, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div className="employee-name">{p.employeeName}</div>
                                            </td>
                                            <td>
                                                <div className="salary-amount paid">{formatCurrency(p.netAmount)}</div>
                                            </td>
                                            <td>
                                                <div className="payment-date">{formatDate(p.paymentDate)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`
                .payroll-page {
                    padding: 0;
                }

                .payroll-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .payroll-filters {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-group label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }

                .payroll-loading {
                    padding: 80px 24px;
                    text-align: center;
                }

                .payroll-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .summary-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 24px;
                }

                .summary-card.pending {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border-color: #f59e0b;
                }

                .summary-icon {
                    font-size: 32px;
                }

                .summary-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }

                .summary-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--admin-text-on-light);
                }

                .payroll-section {
                    margin-bottom: 24px;
                }

                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    padding: 0 16px;
                }

                .employee-name {
                    font-weight: 600;
                }

                .salary-amount {
                    font-weight: 600;
                    color: #b91c1c;
                }

                .salary-amount.paid {
                    color: #166534;
                }

                .payment-date {
                    color: var(--admin-text-muted);
                }

                .no-payments {
                    padding: 40px;
                    text-align: center;
                    color: var(--admin-text-muted);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid var(--admin-bg-dark);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
