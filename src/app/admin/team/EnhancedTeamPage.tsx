'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    getEmployeesWithStats,
    getEmployeeStats,
    addDailyRating,
    paySalary,
    EmployeeWithStats,
    EmployeeStats
} from '@/lib/actions/employee-management';
import { toggleTeamMemberStatus, deleteTeamMember } from '@/lib/actions/team';
import { useRouter } from 'next/navigation';

export default function EnhancedTeamPage() {
    const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
    const [stats, setStats] = useState<EmployeeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [search, setSearch] = useState('');
    const [ratingModal, setRatingModal] = useState<{ open: boolean; employee: EmployeeWithStats | null }>({ open: false, employee: null });
    const [salaryModal, setSalaryModal] = useState<{ open: boolean; employee: EmployeeWithStats | null }>({ open: false, employee: null });
    const router = useRouter();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [employeesData, statsData] = await Promise.all([
                getEmployeesWithStats(),
                getEmployeeStats()
            ]);
            setEmployees(employeesData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleStatus = async (id: string) => {
        await toggleTeamMemberStatus(id);
        router.refresh();
        loadData();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        await deleteTeamMember(id);
        router.refresh();
        loadData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const filteredEmployees = employees.filter(e => {
        if (filter === 'active' && !e.isActive) return false;
        if (filter === 'inactive' && e.isActive) return false;
        if (search) {
            const s = search.toLowerCase();
            return e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s);
        }
        return true;
    });

    return (
        <div className="team-page">
            {/* Header */}
            <div className="team-header">
                <div>
                    <h1 className="admin-title">Team Management</h1>
                    <p className="admin-subtitle">Manage employees, performance ratings, and payroll</p>
                </div>
                <div className="team-header-actions">
                    <Link href="/admin/team/rankings" className="admin-btn admin-btn-outline">
                        🏆 Rankings
                    </Link>
                    <Link href="/admin/team/payroll" className="admin-btn admin-btn-outline">
                        💰 Payroll
                    </Link>
                    <Link href="/admin/team/add" className="admin-btn admin-btn-primary">
                        ➕ Add Employee
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="team-stats-grid">
                    <div className="admin-card team-stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Employees</div>
                            <div className="stat-value">{stats.totalEmployees}</div>
                            <div className="stat-meta">{stats.activeEmployees} active</div>
                        </div>
                    </div>
                    <div className="admin-card team-stat-card">
                        <div className="stat-icon">💵</div>
                        <div className="stat-content">
                            <div className="stat-label">Monthly Payroll</div>
                            <div className="stat-value">{formatCurrency(stats.totalMonthlySalary)}</div>
                            <div className="stat-meta">{stats.paidThisMonth} paid this month</div>
                        </div>
                    </div>
                    <div className="admin-card team-stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-content">
                            <div className="stat-label">Avg Rating (Month)</div>
                            <div className="stat-value">{stats.avgRatingThisMonth}/10</div>
                            <div className="stat-meta">{stats.topPerformer ? `Top: ${stats.topPerformer.name}` : 'No ratings yet'}</div>
                        </div>
                    </div>
                    <div className="admin-card team-stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <div className="stat-label">Pending Leaves</div>
                            <div className="stat-value">{stats.pendingLeaves}</div>
                            <div className="stat-meta">awaiting approval</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="team-filters">
                <div className="team-tabs">
                    {(['all', 'active', 'inactive'] as const).map(f => (
                        <button
                            key={f}
                            type="button"
                            className={`team-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '📋 All' : f === 'active' ? '✅ Active' : '❌ Inactive'}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    className="form-input team-search"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="admin-card">
                {loading ? (
                    <div className="team-loading">
                        <div className="spinner"></div>
                        <p>Loading team...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="team-empty">
                        <div className="team-empty-icon">👥</div>
                        <h3>No Employees Found</h3>
                        <p>Add your first team member to get started</p>
                        <Link href="/admin/team/add" className="admin-btn admin-btn-primary" style={{ marginTop: '16px' }}>
                            Add First Employee
                        </Link>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Position</th>
                                <th>Salary</th>
                                <th>Rating (Month)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar" style={{
                                                background: emp.avatar
                                                    ? `url(${emp.avatar}) center/cover`
                                                    : 'linear-gradient(135deg, #d4af37, #f0d060)'
                                            }}>
                                                {!emp.avatar && emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="employee-name">{emp.name}</div>
                                                <div className="employee-email">{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="employee-position">{emp.position || '-'}</div>
                                        <div className="employee-role">{emp.role?.name || 'No Role'}</div>
                                    </td>
                                    <td>
                                        <div className="employee-salary">
                                            {emp.salary ? formatCurrency(emp.salary) : '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="rating-display">
                                            <div className="rating-stars">
                                                {[...Array(10)].map((_, i) => (
                                                    <span key={i} className={`star ${i < Math.round(emp.monthlyRating) ? 'filled' : ''}`}>
                                                        {i < Math.round(emp.monthlyRating) ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="rating-value">{emp.monthlyRating}/10 ({emp.totalRatings} days)</div>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(emp.id)}
                                            className={`status-badge ${emp.isActive ? 'status-active' : 'status-inactive'}`}
                                        >
                                            {emp.isActive ? '● Active' : '○ Inactive'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="employee-actions">
                                            <button
                                                type="button"
                                                className="action-btn"
                                                onClick={() => setRatingModal({ open: true, employee: emp })}
                                                title="Rate Today"
                                            >
                                                ⭐
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn"
                                                onClick={() => setSalaryModal({ open: true, employee: emp })}
                                                title="Pay Salary"
                                            >
                                                💰
                                            </button>
                                            <Link href={`/admin/team/${emp.id}`} className="action-btn" title="View Profile">
                                                👁️
                                            </Link>
                                            <Link href={`/admin/team/${emp.id}/edit`} className="action-btn" title="Edit">
                                                ✏️
                                            </Link>
                                            <button
                                                type="button"
                                                className="action-btn action-btn-danger"
                                                onClick={() => handleDelete(emp.id, emp.name)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Rating Modal */}
            {ratingModal.open && ratingModal.employee && (
                <RatingModal
                    employee={ratingModal.employee}
                    onClose={() => setRatingModal({ open: false, employee: null })}
                    onSuccess={() => { loadData(); setRatingModal({ open: false, employee: null }); }}
                />
            )}

            {/* Salary Modal */}
            {salaryModal.open && salaryModal.employee && (
                <SalaryModal
                    employee={salaryModal.employee}
                    onClose={() => setSalaryModal({ open: false, employee: null })}
                    onSuccess={() => { loadData(); setSalaryModal({ open: false, employee: null }); }}
                />
            )}

            <style jsx>{`
                .team-page {
                    padding: 0;
                }

                .team-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .team-header-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .team-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                }

                .team-stat-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 24px;
                }

                .stat-icon {
                    font-size: 32px;
                    line-height: 1;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                }

                .stat-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--admin-text-on-light);
                    margin: 4px 0;
                }

                .stat-meta {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .team-filters {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                }

                .team-tabs {
                    display: flex;
                    gap: 8px;
                    background: var(--admin-surface-light);
                    padding: 6px;
                    border-radius: 999px;
                }

                .team-tab {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 18px;
                    border: none;
                    background: transparent;
                    color: var(--admin-text-muted);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 999px;
                    transition: all 0.2s ease;
                }

                .team-tab:hover {
                    background: rgba(0, 0, 0, 0.05);
                }

                .team-tab.active {
                    background: var(--admin-bg-dark);
                    color: #fff;
                }

                .team-search {
                    min-width: 280px;
                }

                .team-loading, .team-empty {
                    padding: 80px 24px;
                    text-align: center;
                }

                .team-empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .employee-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .employee-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #12403C;
                    font-size: 16px;
                }

                .employee-name {
                    font-weight: 600;
                }

                .employee-email, .employee-role {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .employee-position {
                    font-weight: 500;
                }

                .employee-salary {
                    font-weight: 600;
                    color: var(--admin-bg-dark);
                }

                .rating-display {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .rating-stars {
                    display: flex;
                    gap: 1px;
                    font-size: 10px;
                }

                .star {
                    color: #ddd;
                }

                .star.filled {
                    color: #f59e0b;
                }

                .rating-value {
                    font-size: 11px;
                    color: var(--admin-text-muted);
                }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                }

                .status-active {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-inactive {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .employee-actions {
                    display: flex;
                    gap: 6px;
                }

                .action-btn {
                    background: #f3f4f6;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 8px;
                    border-radius: 8px;
                    transition: background 0.2s;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn:hover {
                    background: #e5e7eb;
                }

                .action-btn-danger:hover {
                    background: #fee2e2;
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

                @media (max-width: 768px) {
                    .team-header {
                        flex-direction: column;
                    }

                    .team-filters {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .team-tabs {
                        width: 100%;
                        justify-content: center;
                    }

                    .team-search {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Rating Modal Component
// ==========================================

function RatingModal({
    employee,
    onClose,
    onSuccess
}: {
    employee: EmployeeWithStats;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [score, setScore] = useState(7);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async () => {
        setProcessing(true);
        const result = await addDailyRating(employee.id, score, new Date(date), notes || undefined);
        setProcessing(false);

        if (result.success) {
            toast.success('Rating saved successfully');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to save rating');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Rate Employee</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <div className="modal-body">
                    <div className="employee-info">
                        <div className="employee-avatar-lg" style={{
                            background: employee.avatar
                                ? `url(${employee.avatar}) center/cover`
                                : 'linear-gradient(135deg, #d4af37, #f0d060)'
                        }}>
                            {!employee.avatar && employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="employee-name-lg">{employee.name}</div>
                            <div className="employee-position-lg">{employee.position || 'Team Member'}</div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Score (0-10)</label>
                        <div className="score-slider">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={score}
                                onChange={e => setScore(Number(e.target.value))}
                                className="slider"
                            />
                            <div className="score-display">{score}</div>
                        </div>
                        <div className="score-labels">
                            <span>Poor</span>
                            <span>Average</span>
                            <span>Excellent</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add notes about today's performance..."
                            className="form-input"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleSubmit}
                        disabled={processing}
                    >
                        {processing ? 'Saving...' : 'Save Rating'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 16px;
                }

                .modal-content {
                    background: #fff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 480px;
                    box-shadow: 0 20px 25px -5px rgba(18, 64, 60, 0.1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }

                .modal-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                }

                .modal-body {
                    padding: 24px;
                }

                .employee-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: #f9f9f9;
                    border-radius: 12px;
                }

                .employee-avatar-lg {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #12403C;
                    font-size: 20px;
                }

                .employee-name-lg {
                    font-weight: 600;
                    font-size: 18px;
                }

                .employee-position-lg {
                    color: var(--admin-text-muted);
                    font-size: 14px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                    margin-bottom: 8px;
                }

                .score-slider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .slider {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #12403C;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }

                .score-display {
                    font-size: 32px;
                    font-weight: 700;
                    color: #12403C;
                    min-width: 50px;
                    text-align: center;
                }

                .score-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: var(--admin-text-muted);
                    margin-top: 4px;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 24px;
                    border-top: 1px solid rgba(0,0,0,0.08);
                    background: #fafafa;
                    border-radius: 0 0 20px 20px;
                }
            `}</style>
        </div>
    );
}

// ==========================================
// Salary Modal Component
// ==========================================

function SalaryModal({
    employee,
    onClose,
    onSuccess
}: {
    employee: EmployeeWithStats;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const now = new Date();
    const [baseSalary, setBaseSalary] = useState(employee.salary || 0);
    const [bonus, setBonus] = useState(0);
    const [deductions, setDeductions] = useState(0);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const netAmount = baseSalary + bonus - deductions;

    const handleSubmit = async () => {
        if (netAmount <= 0) {
            toast.error('Net amount must be positive');
            return;
        }

        setProcessing(true);
        const result = await paySalary(
            employee.id,
            baseSalary,
            bonus,
            deductions,
            month,
            year,
            paymentMethod,
            notes || undefined
        );
        setProcessing(false);

        if (result.success) {
            toast.success('Salary paid successfully');
            onSuccess();
        } else {
            toast.error(result.error || 'Failed to process payment');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Pay Salary</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <div className="modal-body">
                    <div className="employee-info">
                        <div className="employee-avatar-lg" style={{
                            background: employee.avatar
                                ? `url(${employee.avatar}) center/cover`
                                : 'linear-gradient(135deg, #d4af37, #f0d060)'
                        }}>
                            {!employee.avatar && employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="employee-name-lg">{employee.name}</div>
                            <div className="employee-position-lg">{employee.position || 'Team Member'}</div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Month</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="form-input">
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Year</label>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} className="form-input">
                                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Base Salary (EGP)</label>
                        <input
                            type="number"
                            value={baseSalary}
                            onChange={e => setBaseSalary(Number(e.target.value))}
                            className="form-input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Bonus (EGP)</label>
                            <input
                                type="number"
                                value={bonus}
                                onChange={e => setBonus(Number(e.target.value))}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Deductions (EGP)</label>
                            <input
                                type="number"
                                value={deductions}
                                onChange={e => setDeductions(Number(e.target.value))}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="net-amount">
                        <span>Net Amount:</span>
                        <span className="net-value">{formatCurrency(netAmount)}</span>
                    </div>

                    <div className="form-group">
                        <label>Payment Method</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-input">
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="vodafone_cash">Vodafone Cash</option>
                            <option value="instapay">InstaPay</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add payment notes..."
                            className="form-input"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="admin-btn admin-btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleSubmit}
                        disabled={processing || netAmount <= 0}
                    >
                        {processing ? 'Processing...' : `Pay ${formatCurrency(netAmount)}`}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 16px;
                }

                .modal-content {
                    background: #fff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 520px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(18, 64, 60, 0.1);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }

                .modal-header h2 {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                }

                .modal-body {
                    padding: 24px;
                }

                .employee-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding: 16px;
                    background: #f9f9f9;
                    border-radius: 12px;
                }

                .employee-avatar-lg {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #12403C;
                    font-size: 20px;
                }

                .employee-name-lg {
                    font-weight: 600;
                    font-size: 18px;
                }

                .employee-position-lg {
                    color: var(--admin-text-muted);
                    font-size: 14px;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--admin-text-muted);
                    margin-bottom: 8px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .net-amount {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: linear-gradient(135deg, #d4af37, #f0d060);
                    border-radius: 12px;
                    margin-bottom: 16px;
                    font-weight: 600;
                }

                .net-value {
                    font-size: 24px;
                    color: #12403C;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 24px;
                    border-top: 1px solid rgba(0,0,0,0.08);
                    background: #fafafa;
                    border-radius: 0 0 20px 20px;
                }
            `}</style>
        </div>
    );
}
