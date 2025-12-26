"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';

export default function NotifyMeForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId })
      });

      if (!res.ok) throw new Error('Failed to subscribe');

      setSent(true);
      toast.success('We will notify you when this item is back in stock!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
        ✅ We&apos;ll email you at <strong>{email}</strong> when available.
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-6">
       <h4 className="font-semibold text-gray-900 mb-2">Out of Stock?</h4>
       <p className="text-sm text-gray-600 mb-4">Get notified immediately when this item is back in stock.</p>
       
       <form onSubmit={handleSubmit} className="flex gap-2">
         <input 
            type="email" 
            required
            placeholder="Enter your email" 
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
         />
         <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
         >
            {loading ? '...' : 'Notify Me'}
         </button>
       </form>
    </div>
  );
}
