'use client';

import { useState } from 'react';
import { approveRequest, rejectRequest } from '@/lib/services/approvalService';

type ApprovalRequestWithRule = {
  id: string;
  entityType: string;
  entityId: string;
  actionType: string;
  actionData: string | null;
  status: string;
  requestedBy: string;
  requestedAt: Date;
  rule: {
    name: string;
    description: string | null;
  };
};

export default function ApprovalsList({ initialApprovals }: { initialApprovals: ApprovalRequestWithRule[] }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    if (!confirm('Are you sure you want to APPROVE this action?')) return;
    
    setProcessingId(id);
    try {
      await approveRequest(id, 'admin-id-placeholder'); // TODO: Real admin ID
      setApprovals(current => current.filter(a => a.id !== id));
      // In a real app, we might move it to "Approved" list instead of removing
    } catch (e) {
      alert('Failed to approve: ' + e);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setProcessingId(id);
    try {
      await rejectRequest(id, 'admin-id-placeholder', reason); // TODO: Real admin ID
      setApprovals(current => current.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to reject: ' + e);
    } finally {
      setProcessingId(null);
    }
  }

  if (approvals.length === 0) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3>No Pending Approvals</h3>
        <p style={{ color: 'var(--text-secondary)' }}>All caught up! No sensitive actions require your attention.</p>
      </div>
    );
  }

  return (
    <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
      {approvals.map(request => (
        <div key={request.id} className="admin-card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>PENDING</span>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>{request.rule.name}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Requested {new Date(request.requestedAt).toLocaleDateString()}
            </div>
          </div>
          
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Action Type:</span>
              <span style={{ fontWeight: 500 }}>{request.actionType}</span>
              
              <span style={{ color: 'var(--text-secondary)' }}>Requested By:</span>
              <span>{request.requestedBy}</span>
              
              <span style={{ color: 'var(--text-secondary)' }}>Details:</span>
              <pre style={{ 
                margin: 0, 
                background: 'var(--bg-secondary)', 
                padding: '8px', 
                borderRadius: '4px', 
                fontSize: '12px',
                overflowX: 'auto'
              }}>
                {JSON.stringify(JSON.parse(request.actionData || '{}'), null, 2)}
              </pre>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => handleReject(request.id)}
              disabled={!!processingId}
            >
              {processingId === request.id ? 'Processing...' : '❌ Reject'}
            </button>
            <button 
              className="admin-btn admin-btn-primary"
              onClick={() => handleApprove(request.id)}
              disabled={!!processingId}
            >
              {processingId === request.id ? 'Processing...' : '✔ Approve & Execute'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
