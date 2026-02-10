'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  fileUrl: string | null;
  createdAt: string;
}

export default function MessagesClient({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const { language } = useLanguage();
  const t = adminDictionary[language as keyof typeof adminDictionary];
  const [messages] = useState<ContactMessage[]>(initialMessages);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'NEW': t.messages?.unread || 'Unread',
      'READ': t.messages?.read || 'Read',
      'REPLIED': t.messages?.archived || 'Replied',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">{t.messages?.title || 'Messages'}</h1>
        <p className="text-gray-500">{t.messages?.subtitle || 'Customer inquiries and contact form submissions'}</p>
      </div>

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.messages?.status || 'Status'}</th>
                <th>{t.messages?.name || 'Name'}</th>
                <th>{t.messages?.subject || 'Subject'}</th>
                <th>{t.messages?.date || 'Date'}</th>
                <th>{t.messages?.action || 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    {t.messages?.no_messages || 'No messages found.'}
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <span className={`status-badge status-${msg.status.toLowerCase()}`}>
                        {getStatusLabel(msg.status)}
                      </span>
                    </td>
                    <td>
                      <div>{msg.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{msg.email}</div>
                    </td>
                    <td>{msg.subject}</td>
                    <td>{new Date(msg.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0f766e', fontSize: '14px' }}>
                            📎 {t.messages?.attachment || 'Attachment'}
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
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
        [dir="rtl"] .admin-table th, [dir="rtl"] .admin-table td {
            text-align: right;
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
