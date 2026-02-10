"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ManualPaymentInstructionsProps {
    type: "wallet" | "instapay";
    onCopyNumber: () => void;
}

export default function ManualPaymentInstructions({ type, onCopyNumber }: ManualPaymentInstructionsProps) {
    const { language } = useLanguage();
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText("01515205073");
        onCopyNumber();
    };

    // Translations
    const t = {
        title: type === 'instapay'
            ? (language === "ar" ? "تفاصيل تحويل إنستا باي" : "InstaPay Transfer Details")
            : (language === "ar" ? "تفاصيل المحفظة الإلكترونية" : "E-Wallet Transfer Details"),

        subtitle: type === 'instapay'
            ? (language === "ar"
                ? "يرجى تحويل إجمالي المبلغ على رقم الحساب التالي عبر تطبيق إنستا باي."
                : "Please transfer the total amount to the following account number via InstaPay.")
            : (language === "ar"
                ? "يرجى تحويل إجمالي المبلغ على رقم فودافون كاش التالي."
                : "Please transfer the total amount to the following Vodafone Cash number."),

        accountLabel: type === 'instapay'
            ? (language === "ar" ? "رقم الهاتف / الحساب" : "Phone / Account Number")
            : (language === "ar" ? "رقم المحفظة" : "Wallet Number"),

        copy: language === "ar" ? "نسخ" : "Copy",
        timerLabel: language === "ar" ? "صلاحية الحجز:" : "Reservation expires in:",
        alertTitle: language === "ar" ? "هام جداً:" : "Important:",
        alertDesc: language === "ar"
            ? "تأكد من إدخال رقم العملية (Reference ID) بدقة في الخانة الأسفل لتأكيد طلبك فوراً."
            : "Make sure to enter the Transaction Reference ID below accurately to confirm your order immediately.",

        badge: type === 'instapay' ? "InstaPay" : "Vodafone Cash & Wallets",
    };

    const themeColor = type === 'instapay' ? 'text-purple-900 bg-purple-50 border-purple-100' : 'text-emerald-900 bg-emerald-50 border-emerald-100';


    return (
        <div className={`border rounded-lg p-4 mb-6 relative overflow-hidden ${themeColor}`}>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className={`font-bold text-lg ${type === 'instapay' ? 'text-purple-800' : 'text-emerald-800'}`}>{t.title}</h3>
                <div className="flex items-center bg-white/60 px-2 py-1 rounded-md border border-gray-200">
                    <svg className="w-4 h-4 text-orange-600 mr-1.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800 tabular-nums">
                        {t.timerLabel} <span className="text-orange-600">{formatTime(timeLeft)}</span>
                    </span>
                </div>
            </div>

            <p className={`text-sm mb-4 leading-relaxed ${type === 'instapay' ? 'text-purple-700' : 'text-emerald-700'}`}>
                {t.subtitle}
            </p>

            {/* Number Card */}
            <div className={`bg-white rounded-lg border p-4 shadow-sm mb-4 flex items-center justify-between relative z-10 ${type === 'instapay' ? 'border-purple-200' : 'border-emerald-200'}`}>
                <div>
                    <p className={`text-xs font-medium mb-1 uppercase tracking-wider ${type === 'instapay' ? 'text-purple-500' : 'text-emerald-500'}`}>{t.accountLabel}</p>
                    <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">01515205073</p>
                    <div className="flex gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${type === 'instapay' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {t.badge}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    type="button"
                    className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-50 transition-colors text-gray-600 group"
                    title={t.copy}
                >
                    <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2}></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2}></path>
                    </svg>
                    <span className="text-xs font-semibold">{t.copy}</span>
                </button>
            </div>

            {/* Warning/Instruction */}
            <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-md border border-blue-100/50 relative z-10">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                    <span className="font-bold">{t.alertTitle}</span> {t.alertDesc}
                </p>
            </div>
        </div>
    );
}
