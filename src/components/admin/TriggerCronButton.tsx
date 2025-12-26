"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function TriggerCronButton() {
  const [loading, setLoading] = useState(false);

  const runJob = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/abandoned-cart', { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` } 
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Processed ${data.processed} abandoned carts.`);
      } else {
        toast.error('Failed to run job.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={runJob} 
      disabled={loading}
      className="admin-btn admin-btn-outline"
      style={{ borderColor: '#b76e00', color: '#b76e00' }}
    >
      {loading ? 'Running...' : '⚡ Run Abandoned Cart Job'}
    </button>
  );
}
