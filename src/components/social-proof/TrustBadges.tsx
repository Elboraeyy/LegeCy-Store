import React from 'react';

export default function TrustBadges() {
  const badges = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ),
      text: "Free Express Shipping"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      text: "2-Year Warranty"
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ),
      text: "100% Authentic"
    }
  ];

  return (
    <div className="trust-badges" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px',
      marginTop: '32px',
      padding: '24px',
      background: 'var(--bg-light)', // Using bg-light for slight contrast against surface
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-light)'
    }}>
      {badges.map((badge, index) => (
        <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: '1 1 auto' 
        }}>
          <div style={{ color: 'var(--accent)' }}>
            {badge.icon}
          </div>
          <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              color: 'var(--text)'
          }}>
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
}
