'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerProData } from '@/lib/actions/customer-pro';
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

interface CustomerTableProps {
    data: CustomerProData[];
    // total: number; // Removed unused
    totalPages: number;
    currentPage: number;
    searchParams: { [key: string]: string | undefined };
}

export default function CustomerTableClient({ data, totalPages, currentPage, searchParams }: CustomerTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);

    // Search State
    const [search, setSearch] = useState(searchParams.search || '');

    // Filter Handlers
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyParams({ search, page: 1 });
    };

    const applyParams = (newParams: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(window.location.search);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        
        startTransition(() => {
            router.push(`/admin/customers?${params.toString()}`);
        });
    };

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.map(c => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(s => s !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <form onSubmit={handleSearch} className="admin-search-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-search-input"
                        />
                    </form>
                    
                    <button 
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`admin-btn ${filterOpen ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                    >
                        Filter
                    </button>
                    
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>{selectedIds.length} selected</span>
                            <button className="admin-btn admin-btn-outline">Tag</button>
                            <button className="admin-btn admin-btn-danger">Ban</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Filters */}
            {filterOpen && (
                <div className="admin-card" style={{ marginBottom: '20px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div>
                        <label className="admin-label">Status</label>
                        <AdminDropdown
                            value={searchParams.status || 'all'}
                            onChange={(val) => applyParams({ status: val, page: 1 })}
                            options={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'banned', label: 'Banned' },
                                { value: 'archived', label: 'Archived' },
                            ]}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={data.length > 0 && selectedIds.length === data.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Spent</th>
                            <th>Orders</th>
                            <th>Tags</th>
                            <th>Joined</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(customer => (
                            <tr key={customer.id} style={{ background: selectedIds.includes(customer.id) ? '#f0f9ff' : undefined }}>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(customer.id)}
                                        onChange={() => toggleSelect(customer.id)}
                                    />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: '#3b82f6', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '12px'
                                        }}>
                                            {customer.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{customer.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{customer.email}</div>
                                            {customer.phone && <div style={{ fontSize: '11px', color: '#999' }}>{customer.phone}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                        background: customer.status === 'active' ? '#dcfce7' : customer.status === 'banned' ? '#fee2e2' : '#f3f4f6',
                                        color: customer.status === 'active' ? '#166534' : customer.status === 'banned' ? '#991b1b' : '#374151'
                                    }}>
                                        {customer.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(customer.totalSpend)}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', fontSize: '11px'
                                    }}>
                                        {customer.totalOrders} orders
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {customer.tags.map(tag => (
                                            <span key={tag} style={{
                                                fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe'
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ fontSize: '12px', color: '#666' }}>
                                    {new Date(customer.joinedAt).toLocaleDateString()}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <Link 
                                        href={`/admin/customers/${customer.id}`}
                                        className="admin-btn admin-btn-outline"
                                        style={{ fontSize: '11px', padding: '4px 12px' }}
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                     <button
                        onClick={() => applyParams({ page: currentPage - 1 })}
                        disabled={currentPage <= 1 || isPending}
                        className="admin-btn admin-btn-outline"
                    >
                        Previous
                    </button>
                    <span style={{ padding: '8px', alignSelf: 'center', fontSize: '13px' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => applyParams({ page: currentPage + 1 })}
                        disabled={currentPage >= totalPages || isPending}
                        className="admin-btn admin-btn-outline"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
