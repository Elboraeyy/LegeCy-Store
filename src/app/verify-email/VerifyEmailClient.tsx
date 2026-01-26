'use client';

import { useEffect, useState } from 'react';
import { verifyEmail } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailClient({ token }: { token: string }) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        const verify = async () => {
            try {
                const result = await verifyEmail(token);
                if (result.success) {
                    setStatus('success');
                    // Give user a moment to see the success message before redirecting
                    setTimeout(() => {
                        window.location.href = '/'; // Hard reload to ensure session is picked up
                    }, 2000);
                } else {
                    setStatus('error');
                    setErrorMessage(result.error || 'Verification failed');
                }
            } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
                setStatus('error');
                setErrorMessage('An unexpected error occurred');
            }
        };

        verify();
    }, [token, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12403C] mb-4"></div>
                <h1 className="text-xl font-semibold text-[#12403C]">Verifying your email...</h1>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#12403C] mb-4">Email Verified!</h1>
                    <p className="text-gray-600 mb-8">
                        Redirecting you to the homepage...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⚠️</span>
                </div>
                <h1 className="text-3xl font-bold text-[#12403C] mb-4">Verification Failed</h1>
                <p className="text-[#12403C] font-semibold mb-8">
                    {errorMessage}
                </p>
                <Link 
                    href="/login"
                    className="text-[#12403C] underline font-medium hover:text-[#D4AF37]"
                >
                    Return to Login
                </Link>
            </div>
        </div>
    );
}
