'use client';

import { useEffect, useState } from 'react';

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: string;
  adminId: string;
  adminName?: string;
  createdAt: Date;
  ipAddress?: string;
};

export default function AuditTimelinePage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const params = filter !== 'all' ? `?entityType=${filter}` : '';
        const res = await fetch(`/api/admin/audit${params}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setEvents(data.logs || []);
        }
      } catch (error) {
        console.error('Failed to load audit events:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, [filter]);

  const getEventStyle = (action: string) => {
    const defaultStyle = { icon: '📋', color: 'bg-gray-100 text-gray-800' };
    
    if (action.includes('LOGIN')) return { icon: '🔐', color: 'bg-blue-100 text-blue-800' };
    if (action.includes('CREATE')) return { icon: '➕', color: 'bg-green-100 text-green-800' };
    if (action.includes('UPDATE') || action.includes('EDIT')) return { icon: '✏️', color: 'bg-amber-100 text-amber-800' };
    if (action.includes('DELETE')) return { icon: '🗑️', color: 'bg-red-100 text-red-800' };
    if (action.includes('APPROVE')) return { icon: '✅', color: 'bg-green-100 text-green-800' };
    if (action.includes('REJECT')) return { icon: '❌', color: 'bg-red-100 text-red-800' };
    if (action.includes('REFUND')) return { icon: '💸', color: 'bg-purple-100 text-purple-800' };
    if (action.includes('ORDER')) return { icon: '📦', color: 'bg-blue-100 text-blue-800' };
    
    return defaultStyle;
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('ar-EG', { 
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const groupEventsByDate = (events: AuditEvent[]) => {
    const groups: Record<string, AuditEvent[]> = {};
    events.forEach(event => {
      const date = new Date(event.createdAt).toLocaleDateString('ar-EG');
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate(events);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c34]">سجل الأحداث المرئي</h1>
        <p className="text-gray-500">Audit Timeline - تتبع كل الأحداث والتغييرات</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'الكل', icon: '📋' },
          { key: 'ORDER', label: 'الطلبات', icon: '📦' },
          { key: 'REFUND', label: 'المرتجعات', icon: '💸' },
          { key: 'USER', label: 'المستخدمين', icon: '👤' },
          { key: 'SYSTEM', label: 'النظام', icon: '⚙️' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              filter === f.key ? 'bg-[#1a3c34] text-white' : 'bg-white border'
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <span className="text-5xl">📋</span>
          <h3 className="text-xl font-semibold mt-4 text-gray-700">لا توجد أحداث</h3>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="sticky top-0 bg-gray-50 z-10 py-2 px-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-700">{date}</h3>
              </div>
              
              {/* Events */}
              <div className="relative pr-8">
                {/* Timeline Line */}
                <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {dateEvents.map((event) => {
                  const style = getEventStyle(event.action);
                  return (
                    <div key={event.id} className="relative mb-4">
                      {/* Timeline Dot */}
                      <div 
                        className={`absolute right-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.color}`}
                        style={{ transform: 'translateX(50%)' }}
                      >
                        {style.icon}
                      </div>
                      
                      {/* Event Card */}
                      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm mr-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-xs ${style.color}`}>
                              {event.action}
                            </span>
                            <span className="text-xs text-gray-400 mr-2">
                              {event.entityType}
                              {event.entityId && ` #${event.entityId.slice(0, 8)}`}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTime(event.createdAt)}
                          </span>
                        </div>
                        
                        {event.metadata && (
                          <p className="text-sm text-gray-600 mt-2">
                            {(() => {
                              try {
                                const meta = JSON.parse(event.metadata);
                                return Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(', ');
                              } catch {
                                return event.metadata;
                              }
                            })()}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>👤 {event.adminName || event.adminId.slice(0, 8)}</span>
                          {event.ipAddress && <span>🌐 {event.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
