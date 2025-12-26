"use client";

import React, { useEffect, useState } from 'react';
import styles from './AuditLog.module.css';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
}

interface AuditLogResponse {
  data: AuditLogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState<AuditLogResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${p}&limit=10`);
      if (res.ok) {
        const json: AuditLogResponse = await res.json();
        setLogs(json.data);
        setMeta(json.meta);
        setPage(p);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  if (loading && logs.length === 0) {
    return <div className={styles.loading}>Loading logs...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>System Audit Logs</div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className={styles.timeMap}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td>
                  <span className={styles.adminName}>{log.admin.name}</span>
                </td>
                <td>
                  <span className={styles.actionBadge}>{log.action}</span>
                </td>
                <td>
                    {log.entityType} {log.entityId ? `#${log.entityId.slice(0,8)}` : ''}
                </td>
                <td className={styles.metadata}>
                  {log.metadata ? (
                    <code title={log.metadata}>
                      {log.metadata.length > 50 ? log.metadata.slice(0,50) + '...' : log.metadata}
                    </code>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {meta && (
        <div className={styles.pagination}>
          <button 
            disabled={page <= 1} 
            onClick={() => fetchLogs(page - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {meta.page} of {meta.totalPages} ({meta.total} entries)
          </span>
          <button 
            disabled={page >= meta.totalPages} 
            onClick={() => fetchLogs(page + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

