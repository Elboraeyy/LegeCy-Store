import { Metadata } from 'next';
import Link from 'next/link';
import { getPendingApprovals } from '@/lib/services/approvalService';
import ApprovalsList from './ApprovalsList';

export const metadata: Metadata = {
  title: 'Approvals | Team',
};

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const pendingApprovals = await getPendingApprovals();

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/team" className="back-link">← Back to Team</Link>
          <h1>Approval Workflows</h1>
          <p className="page-subtitle">Manage approval rules and pending requests</p>
        </div>
      </div>

      <ApprovalsList initialApprovals={pendingApprovals} />
    </div>
  );
}
