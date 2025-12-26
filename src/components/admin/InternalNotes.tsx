'use client';

import { useState, useEffect } from 'react';
import { getOrderNotes, createOrderNote, OrderNote } from '@/lib/actions/orderNotes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import '@/app/admin/admin.css';

interface InternalNotesProps {
    orderId: string;
}

export default function InternalNotes({ orderId }: InternalNotesProps) {
    const router = useRouter();
    const [notes, setNotes] = useState<OrderNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const fetchNotes = async () => {
            try {
                const data = await getOrderNotes(orderId);
                if (isMounted) {
                    setNotes(data);
                }
            } catch (error) {
                console.error('Failed to load notes:', error);
            }
        };

        fetchNotes();
        
        return () => {
            isMounted = false;
        };
    }, [orderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setLoading(true);
        const result = await createOrderNote(orderId, newNote);
        
        if (result.success) {
            toast.success('Note added');
            setNewNote('');
            // Refetch notes
            const data = await getOrderNotes(orderId);
            setNotes(data);
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to add note');
        }
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-card">
            <div 
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: isExpanded ? '16px' : 0
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="stat-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📝 Internal Notes
                    {notes.length > 0 && (
                        <span style={{ 
                            fontSize: '11px', 
                            background: 'var(--admin-surface-light)', 
                            padding: '2px 8px', 
                            borderRadius: '99px' 
                        }}>
                            {notes.length}
                        </span>
                    )}
                </h3>
                <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                    ▼
                </span>
            </div>

            {isExpanded && (
                <>
                    <form onSubmit={handleSubmit} style={{ marginBottom: notes.length > 0 ? '16px' : 0 }}>
                        <textarea
                            className="form-input"
                            placeholder="Add an internal note about this order..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            disabled={loading}
                            rows={2}
                            style={{ resize: 'vertical', marginBottom: '8px' }}
                        />
                        <button 
                            type="submit" 
                            className="admin-btn admin-btn-primary"
                            disabled={loading || !newNote.trim()}
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                            {loading ? 'Adding...' : 'Add Note'}
                        </button>
                    </form>

                    {notes.length > 0 && (
                        <div style={{ 
                            borderTop: '1px solid var(--admin-border)', 
                            paddingTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {notes.map((note) => (
                                <div 
                                    key={note.id}
                                    style={{ 
                                        background: '#fffef5',
                                        border: '1px solid #fff3cd',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                            {note.adminName}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                            {formatDate(note.createdAt)}
                                        </span>
                                    </div>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: '13px', 
                                        color: 'var(--admin-text-on-light)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {note.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {notes.length === 0 && !newNote && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '24px', 
                            color: 'var(--admin-text-muted)',
                            fontSize: '13px'
                        }}>
                            No notes yet. Add one above.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
