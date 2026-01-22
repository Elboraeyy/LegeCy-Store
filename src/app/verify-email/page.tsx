import { verifyEmail } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function VerifyEmailPage({
    searchParams
}: {
    searchParams: { token?: string; sent?: string; email?: string, error?: string }
}) {
    const { token, sent, error: errorParam } = await searchParams;

    // Case 1: Processing Verification Token
    if (token) {
        const result = await verifyEmail(token);
        
        if (result.success) {
            // Session is already created in verifyEmail, just redirect to home
            redirect('/');
        } else {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#12403C] mb-4">Verification Failed</h1>
                        <p className="text-red-500 mb-8">
                            {result.error || 'The verification link is invalid or has expired.'}
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
    }

    // Case 2: Just Sent Email
    if (sent) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📨</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#12403C] mb-4">Check Your Email</h1>
                    <p className="text-gray-600 mb-6">
                        We&apos;ve sent a verification link to your email address. Please click the link to verify your account.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-blue-800">
                            Can&apos;t find it? Check your spam folder or wait a few minutes.
                        </p>
                    </div>
                    <Link 
                        href="/login"
                        className="text-[#12403C] font-semibold hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Case 3: Error Message Display
    if (errorParam) {
         return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#12403C] mb-4">Verification Required</h1>
                    <p className="text-gray-600 mb-8">
                        {errorParam === 'unverified' 
                            ? 'Please verify your email address to access your account.' 
                            : 'An error occurred with your verification.'}
                    </p>
                    
                    {/* Simple Refetch Form to Resend */}
                    {/* For now, just a helpful message, usually we'd have a form here */}
                    <div className="border-t pt-6">
                        <p className="text-sm text-gray-500">
                             Need to resend the link? Log in again to trigger a new email.
                        </p>
                         <Link 
                            href="/login"
                            className="mt-4 inline-block text-[#12403C] font-semibold hover:underline"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
         );
    }

    // Default View
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
             <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <h1 className="text-2xl font-bold text-[#12403C] mb-4">Email Verification</h1>
                 <p className="text-gray-600 mb-8">
                    Please use the link sent to your email to verify your account.
                </p>
                 <Link 
                    href="/login"
                    className="inline-block bg-[#12403C] text-[#D4AF37] px-8 py-3 rounded-full font-semibold hover:bg-[#0A2622] transition-colors"
                >
                    Login
                </Link>
            </div>
        </div>
    );
}
