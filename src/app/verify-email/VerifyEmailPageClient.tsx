'use client';

import { useLanguage } from "@/context/LanguageContext";
import VerifyEmailClient from "./VerifyEmailClient";
import ResendVerificationButton from "./ResendVerificationButton";
import Link from "next/link";
import { Mail, AlertTriangle } from "lucide-react";

interface VerifyEmailPageClientProps {
    token?: string;
    sent?: string;
    email?: string;
    error?: string;
}

export default function VerifyEmailPageClient({ token, sent, email, error }: VerifyEmailPageClientProps) {
    const { t, language } = useLanguage();

    // Case 1: Processing Verification Token
    if (token) {
        return <VerifyEmailClient token={token} />;
    }

    // Case 2: Email Sent Confirmation
    if (sent && email) {
        return (
            <div className={`min-h-[60vh] flex flex-col items-center justify-center p-4 ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-[#12403C]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#12403C]">
                        <Mail size={40} />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-[#12403C] mb-4">
                        {t.verify_email.sent.title}
                    </h1>
                    
                    <p className="text-gray-600 mb-6">
                        {t.verify_email.sent.message.replace('{email}', email)}
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-6">
                        <p className="text-sm text-yellow-800">
                            {t.verify_email.sent.spam}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Link 
                            href="/login"
                            className="block w-full bg-[#12403C] text-white py-3 rounded-lg font-semibold hover:bg-[#1a5650] transition-colors"
                        >
                            {t.verify_email.sent.back}
                        </Link>
                        
                        <ResendVerificationButton email={email} />
                    </div>
                </div>
            </div>
        );
    }

    // Case 3: Error or Default State
    return (
        <div className={`min-h-[60vh] flex flex-col items-center justify-center p-4 ${language === 'ar' ? 'rtl' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                    <AlertTriangle size={40} />
                </div>
                
                <h1 className="text-3xl font-bold text-[#12403C] mb-4">
                    {t.verify_email.error.title}
                </h1>
                
                {error ? (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6">
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-600 mb-6">
                        {t.verify_email.error.unverified}
                    </p>
                )}

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        {t.verify_email.error.need_resend}
                    </p>
                    <Link 
                        href="/login"
                        className="block w-full bg-[#12403C] text-white py-3 rounded-lg font-semibold hover:bg-[#1a5650] transition-colors"
                    >
                         {t.verify_email.default.login}
                    </Link>
                </div>
            </div>
        </div>
    );
}
