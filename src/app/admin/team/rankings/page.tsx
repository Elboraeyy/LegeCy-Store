'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { getMonthlyRankings, MonthlyRanking } from '@/lib/actions/employee-management';
import Link from 'next/link';

export default function RankingsPage() {
    const now = new Date();
    const [rankings, setRankings] = useState<MonthlyRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        let cancelled = false;
        
        const loadData = async () => {
            setLoading(true);
            const data = await getMonthlyRankings(month, year);
            if (!cancelled) {
                setRankings(data);
                setLoading(false);
            }
        };
        
        loadData();
        
        return () => { cancelled = true; };
    }, [month, year]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: '🥇', class: 'rank-gold' };
        if (rank === 2) return { emoji: '🥈', class: 'rank-silver' };
        if (rank === 3) return { emoji: '🥉', class: 'rank-bronze' };
        return { emoji: `#${rank}`, class: 'rank-default' };
    };

    return (
        <div className="rankings-page">
            {/* Header */}
            <div className="rankings-header">
                <div>
                    <h1 className="admin-title">🏆 Monthly Rankings</h1>
                    <p className="admin-subtitle">Employee performance leaderboard based on daily ratings</p>
                </div>
                <Link href="/admin/team" className="admin-btn admin-btn-outline">
                    ← Back to Team
                </Link>
            </div>

            {/* Month/Year Selector */}
            <div className="rankings-filters">
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
            </div>

            {/* Rankings */}
            <div className="admin-card">
                {loading ? (
                    <div className="rankings-loading">
                        <div className="spinner"></div>
                        <p>Loading rankings...</p>
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="rankings-empty">
                        <div className="empty-icon">📊</div>
                        <h3>No Ratings Yet</h3>
                        <p>No employee ratings for {months[month - 1]} {year}</p>
                    </div>
                ) : (
                    <div className="rankings-list">
                        {rankings.map(emp => {
                            const badge = getRankBadge(emp.rank);
                            return (
                                <div key={emp.employeeId} className={`ranking-item ${badge.class}`}>
                                    <div className="rank-badge">{badge.emoji}</div>
                                    <div className="employee-avatar" style={{
                                        background: emp.avatar
                                            ? `url(${emp.avatar}) center/cover`
                                            : 'linear-gradient(135deg, #d4af37, #f0d060)'
                                    }}>
                                        {!emp.avatar && emp.employeeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="employee-info">
                                        <div className="employee-name">{emp.employeeName}</div>
                                        <div className="employee-position">{emp.position || 'Team Member'}</div>
                                    </div>
                                    <div className="score-info">
                                        <div className="avg-score">{emp.avgScore}/10</div>
                                        <div className="score-details">
                                            Total: {emp.totalScore} pts • {emp.ratingCount} days
                                        </div>
                                    </div>
                                    <div className="rating-bar">
                                        <div className="rating-fill" style={{ width: `${emp.avgScore * 10}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx>{`
                .rankings-page {
                    padding: 0;
                }

                .rankings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .rankings-filters {
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

                .filter-group .form-input {
                    min-width: 150px;
                }

                .rankings-loading, .rankings-empty {
                    padding: 80px 24px;
                    text-align: center;
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .rankings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 16px;
                }

                .ranking-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    border-radius: 16px;
                    background: #fff;
                    border: 1px solid #eee;
                    transition: all 0.2s;
                }

                .ranking-item:hover {
                    border-color: #ddd;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .ranking-item.rank-gold {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border-color: #f59e0b;
                }

                .ranking-item.rank-silver {
                    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
                    border-color: #9ca3af;
                }

                .ranking-item.rank-bronze {
                    background: linear-gradient(135deg, #fed7aa, #fdba74);
                    border-color: #f97316;
                }

                .rank-badge {
                    font-size: 28px;
                    min-width: 50px;
                    text-align: center;
                }

                .employee-avatar {
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

                .employee-info {
                    flex: 1;
                }

                .employee-name {
                    font-size: 18px;
                    font-weight: 600;
                }

                .employee-position {
                    font-size: 13px;
                    color: var(--admin-text-muted);
                }

                .score-info {
                    text-align: right;
                    min-width: 120px;
                }

                .avg-score {
                    font-size: 28px;
                    font-weight: 700;
                    color: #12403C;
                }

                .score-details {
                    font-size: 12px;
                    color: var(--admin-text-muted);
                }

                .rating-bar {
                    width: 120px;
                    height: 8px;
                    background: rgba(0,0,0,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .rating-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #34d399);
                    border-radius: 4px;
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
                    .ranking-item {
                        flex-wrap: wrap;
                    }

                    .rating-bar {
                        width: 100%;
                        order: 10;
                        margin-top: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
