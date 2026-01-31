import React from 'react';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Messages | Admin Dashboard',
};

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Messages</h1>
      </div>

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No messages found.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <span className={`status-badge status-${msg.status.toLowerCase()}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td>
                      <div>{msg.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{msg.email}</div>
                    </td>
                    <td>{msg.subject}</td>
                    <td>{new Date(msg.createdAt).toLocaleDateString()}</td>
                    <td>
                        {/* Wrapper for future "View" or "Reply" functionality */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                           {msg.fileUrl && (
                                <a href="#" style={{ color: '#0f766e', fontSize: '14px' }}>
                                    📎 Attachment
                                </a>
                           )}
                           {/* Using a simple detail view or verify later */}
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Simple embedded styles for this page until centralized */}
      <style>{`
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-new { background-color: #dbeafe; color: #1e40af; }
        .status-read { background-color: #f3f4f6; color: #374151; }
        .status-replied { background-color: #d1fae5; color: #065f46; }
        
        .admin-table {
            width: 100%;
            border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .admin-table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .admin-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .admin-header {
            margin-bottom: 20px;
        }
        .admin-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
        }
      `}</style>
    </div>
  );
}
