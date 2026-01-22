'use client';

import { useState } from 'react';
import { resendVerification } from '@/lib/actions/auth';

export default function ResendVerificationButton({ email }: { email: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        if (status === 'loading') return;
        
        setStatus('loading');
        try {
            const result = await resendVerification(email);
            if (result.success) {
                setStatus('success');
                setMessage('Email sent successfully!');
            } else {
                setStatus('error');
                setMessage(result.error || 'Failed to send email.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An unexpected error occurred.');
        }
    };

    return (
        <div className="flex flex-col items-center mt-4">
            <button 
                onClick={handleResend}
                disabled={status === 'loading' || status === 'success'}
                className="text-[#12403C] underline font-medium hover:text-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? 'Sending...' : 'Resend Verification Email'}
            </button>
            {message && (
                <p className={`text-sm mt-2 ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
