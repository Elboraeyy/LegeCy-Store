'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional override for the wrapper's inline style */
  wrapperStyle?: React.CSSProperties;
}

/**
 * A drop-in replacement for <input type="password" /> that adds a
 * show/hide toggle button (eye icon) on the right side.
 *
 * Accepts all standard input props — just swap `<input … />` → `<PasswordInput … />`.
 */
export default function PasswordInput({
  style,
  wrapperStyle,
  className,
  ...rest
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        ...wrapperStyle,
      }}
    >
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        className={className}
        style={{
          ...style,
          paddingRight: '48px', // room for the eye icon
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          transition: 'color 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#12403C';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#888';
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
