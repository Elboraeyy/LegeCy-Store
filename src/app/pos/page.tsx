"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './pos.css';

interface Terminal {
    id: string;
    name: string;
    code: string;
    warehouseName: string;
    isActive: boolean;
}

// Demo terminals - always available
const DEMO_TERMINALS: Terminal[] = [
    { id: 'terminal-1', name: 'Terminal 1', code: 'POS-01', warehouseName: 'Main Store', isActive: true },
    { id: 'terminal-2', name: 'Terminal 2', code: 'POS-02', warehouseName: 'Main Store', isActive: true },
    { id: 'terminal-3', name: 'Terminal 3', code: 'POS-03', warehouseName: 'Branch Store', isActive: true },
];

export default function POSLoginPage() {
    const router = useRouter();
    const [terminals, setTerminals] = useState<Terminal[]>(DEMO_TERMINALS);
    const [selectedTerminal, setSelectedTerminal] = useState('');
    const [pin, setPin] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const pinInputRef = useRef<HTMLInputElement>(null);

    // Fetch terminals from API, fallback to demo
    useEffect(() => {
        async function fetchTerminals() {
            try {
                const res = await fetch('/api/pos/terminals');
                if (res.ok) {
                    const data = await res.json();
                    if (data.terminals && data.terminals.length > 0) {
                        setTerminals(data.terminals);
                    }
                }
            } catch {
                // Keep demo terminals
            }
        }
        fetchTerminals();
    }, []);

    // Handle keyboard PIN input
    const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow only numbers, backspace, delete
        if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
            e.preventDefault();
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(value);
    };

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            pinInputRef.current?.focus();
        }
    };

    const handlePinClear = () => {
        setPin('');
        pinInputRef.current?.focus();
    };
    
    const handlePinBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        pinInputRef.current?.focus();
    };

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTerminal) {
            setError('Please select a terminal');
            return;
        }
        if (pin.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/pos/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    terminalId: selectedTerminal,
                    pin,
                    openingBalance: parseFloat(openingBalance) || 0
                })
            });

            const data = await res.json();
            
            if (res.ok && data.session) {
                localStorage.setItem('pos_session', JSON.stringify(data.session));
                router.push('/pos/terminal');
                return;
            }
        } catch {
            // Continue to demo mode only in development
        }

        // Demo mode - create local session (DEVELOPMENT ONLY)
        // In production, this will not be reached if API is working correctly
        if (process.env.NODE_ENV === 'production') {
            setError('Unable to connect to POS server. Please try again.');
            setLoading(false);
            return;
        }

        const terminal = terminals.find(t => t.id === selectedTerminal);
        localStorage.setItem('pos_session', JSON.stringify({
            id: `session-${Date.now()}`,
            sessionNo: `POS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-0001`,
            cashierId: 'demo-cashier',
            cashierName: 'Demo Cashier',
            terminalId: selectedTerminal,
            terminalName: terminal?.name || 'Terminal 1',
            startedAt: new Date().toISOString(),
            openingBalance: parseFloat(openingBalance) || 0,
            status: 'OPEN'
        }));
        router.push('/pos/terminal');
        setLoading(false);
    };

    return (
        <div className="pos-login-wrapper">
            {/* Left: Brand Side (Green) */}
            <div className="pos-login-brand">
                <div className="pos-login-brand-content">
                    <div className="pos-login-title">
                        Legacy<br/>POS
                    </div>
                    <p className="pos-login-desc">
                        Streamline your sales process. Fast checkout, inventory management, and real-time reporting all in one powerful terminal.
                    </p>
                    <div className="pos-login-features">
                        <span>Fast</span> • <span>Secure</span> • <span>Reliable</span>
                    </div>
                </div>
            </div>

            {/* Right: Login Form (Beige/Light) */}
            <div className="pos-login-form-side">
                <div className="pos-login-form-container">
                    <div className="pos-login-form-header">
                        <h2 className="pos-login-form-title">Start Shift</h2>
                        <p className="pos-login-form-subtitle">Select your terminal and enter your PIN to begin.</p>
                    </div>

                    <form onSubmit={handleStartSession}>
                        {/* Terminal Selection */}
                        <div className="pos-form-group">
                            <label className="pos-form-label">Select Terminal</label>
                            <select
                                className="pos-form-select"
                                value={selectedTerminal}
                                onChange={(e) => setSelectedTerminal(e.target.value)}
                                required
                            >
                                <option value="">Choose a terminal...</option>
                                {terminals.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.code}) - {t.warehouseName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PIN Input - 4 digits with keyboard support */}
                        <div className="pos-form-group">
                            <label className="pos-form-label">Enter PIN (4 digits)</label>
                            
                            {/* Hidden text input for keyboard typing */}
                            <input
                                ref={pinInputRef}
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={4}
                                value={pin}
                                onChange={handlePinChange}
                                onKeyDown={handlePinKeyDown}
                                className="pos-form-input"
                                style={{ 
                                    textAlign: 'center', 
                                    letterSpacing: '8px', 
                                    fontSize: '1.5rem',
                                    fontWeight: '600'
                                }}
                                placeholder="••••"
                                autoComplete="off"
                            />

                            {/* Visual PIN dots */}
                            <div className="pos-pin-display" style={{ marginTop: '12px' }}>
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`pos-pin-dot ${i < pin.length ? 'filled' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Numpad - optional, for touch screens */}
                        <div className="pos-numpad">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`pos-numpad-btn ${key === 'C' ? 'clear' : ''}`}
                                    onClick={() => {
                                        if (key === 'C') handlePinClear();
                                        else if (key === '⌫') handlePinBackspace();
                                        else handlePinInput(key);
                                    }}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        {/* Opening Balance */}
                        <div className="pos-form-group">
                            <label className="pos-form-label">Opening Cash Balance (Optional)</label>
                            <input
                                type="number"
                                className="pos-form-input"
                                placeholder="0.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {error && <div className="pos-error">{error}</div>}

                        <button 
                            type="submit" 
                            className="pos-btn-primary"
                            disabled={loading || !selectedTerminal || pin.length !== 4}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <span className="pos-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                                    Starting...
                                </span>
                            ) : (
                                'START SESSION'
                            )}
                        </button>
                    </form>

                    <p className="pos-login-footer">
                        Legacy Store • Point of Sale v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
