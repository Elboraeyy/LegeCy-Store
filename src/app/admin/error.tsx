'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Error:', error);
  }, [error]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      background: '#fff', 
      borderRadius: '8px',
      border: '1px solid #fee2e2',
      maxWidth: '600px',
      margin: '40px auto'
    }}>
      <h2 style={{ color: '#991b1b', marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>
        Something went wrong!
      </h2>
      <p style={{ color: '#4b5563', marginBottom: '24px' }}>
        {error.message || 'An unexpected error occurred in the admin dashboard.'}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '8px 16px',
          background: '#991b1b',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Try again
      </button>
    </div>
  );
}
