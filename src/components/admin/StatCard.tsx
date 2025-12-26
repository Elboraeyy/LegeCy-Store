import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function StatCard({ label, value, highlight = false }: StatCardProps) {
  const cardStyle = {
    backgroundColor: 'var(--surface-glass)',
    backdropFilter: 'blur(10px)',
    border: highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    boxShadow: highlight ? '0 10px 30px rgba(212, 175, 55, 0.1)' : 'none',
    transition: 'transform 0.3s ease',
  };

  const labelStyle = {
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    color: 'var(--text-muted-dark)',
    marginBottom: '4px',
    fontWeight: 500,
  };

  const valueStyle = {
    fontSize: '36px',
    fontFamily: 'var(--font-heading)',
    fontWeight: 400,
    color: highlight ? 'var(--accent)' : 'var(--text-on-dark)',
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  return (
    <div style={cardStyle}>
      <h3 style={labelStyle}>{label}</h3>
      <p style={valueStyle}>{value}</p>
    </div>
  );
}
