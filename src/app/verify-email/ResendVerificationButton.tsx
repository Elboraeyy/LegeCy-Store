'use client';

import { useState } from 'react';
import { resendVerification } from '@/lib/actions/auth';
import { useLanguage } from "@/context/LanguageContext";

export default function ResendVerificationButton({ email }: { email: string }) {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        if (status === 'loading') return;
        
        setStatus('loading');
        try {
            const result = await resendVerification(email);
            if (result.success) {
                setStatus('success');
                setMessage(t.verify_email.sent.sent_success);
            } else {
                setStatus('error');
                setMessage(result.error || t.verify_email.error.generic);
            }
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            setStatus('error');
            setMessage(t.verify_email.error.generic);
        }
    };

    return (
        <div className="flex flex-col items-center mt-4">
            <button 
                onClick={handleResend}
                disabled={status === 'loading' || status === 'success'}
                className="text-[#12403C] underline font-medium hover:text-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? t.verify_email.sent.sending : t.verify_email.sent.resend}
            </button>
            {message && (
                <p className={`text-sm mt-2 ${status === 'success' ? 'text-green-600' : 'text-[#12403C]'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
