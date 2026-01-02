'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TeamMember } from '@/lib/actions/team';
import { toggleTeamMemberStatus, deleteTeamMember } from '@/lib/actions/team';
import { useRouter } from 'next/navigation';

interface Props {
    members: TeamMember[];
}

export default function TeamTable({ members }: Props) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const handleToggleStatus = async (id: string) => {
        setLoading(id);
        await toggleTeamMemberStatus(id);
        router.refresh();
        setLoading(null);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }
        setLoading(id);
        await deleteTeamMember(id);
        router.refresh();
        setLoading(null);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (members.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>👥</div>
                <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>No Team Members Yet</h3>
                <p style={{ margin: '0 0 24px', fontSize: '14px' }}>Add your first team member to get started</p>
                <Link href="/admin/team/add" className="admin-btn admin-btn-primary">
                    Add First Member
                </Link>
            </div>
        );
    }

    return (
        <div className="admin-table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Contact</th>
                        <th>Position</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr key={member.id}>
                            {/* Member Info */}
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: member.avatar 
                                            ? `url(${member.avatar}) center/cover`
                                            : 'linear-gradient(135deg, #d4af37, #f0d060)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#12403C'
                                    }}>
                                        {!member.avatar && member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{member.email}</div>
                                    </div>
                                </div>
                            </td>

                            {/* Contact */}
                            <td>
                                <div style={{ fontSize: '13px' }}>
                                    {member.phone || '-'}
                                </div>
                            </td>

                            {/* Position */}
                            <td>
                                <div style={{ fontSize: '13px' }}>
                                    {member.position || '-'}
                                </div>
                            </td>

                            {/* Role */}
                            <td>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '99px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: member.role?.name === 'super_admin' ? '#fef3c7' : '#e5e7eb',
                                    color: member.role?.name === 'super_admin' ? '#92400e' : '#374151'
                                }}>
                                    {member.role?.name || 'No Role'}
                                </span>
                            </td>

                            {/* Status */}
                            <td>
                                <button
                                    onClick={() => handleToggleStatus(member.id)}
                                    disabled={loading === member.id}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '99px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: member.isActive ? '#dcfce7' : '#fee2e2',
                                        color: member.isActive ? '#166534' : '#b91c1c',
                                        opacity: loading === member.id ? 0.5 : 1
                                    }}
                                >
                                    {member.isActive ? '● Active' : '○ Inactive'}
                                </button>
                            </td>

                            {/* Last Login */}
                            <td>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    {formatDate(member.lastLoginAt)}
                                </div>
                            </td>

                            {/* Actions */}
                            <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link 
                                        href={`/admin/team/${member.id}`}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#f3f4f6',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            textDecoration: 'none',
                                            color: '#333'
                                        }}
                                    >
                                        View
                                    </Link>
                                    <Link 
                                        href={`/admin/team/${member.id}/edit`}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#12403C',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(member.id, member.name)}
                                        disabled={loading === member.id}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#fee2e2',
                                            color: '#b91c1c',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            opacity: loading === member.id ? 0.5 : 1
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
