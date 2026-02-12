'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdminConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'warning' | 'info' | 'success' | 'danger';
    isPending?: boolean;
}

export default function AdminConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'info',
    isPending = false,
}: AdminConfirmDialogProps) {

    const getIcon = () => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-6 w-6 text-amber-500" />;
            case 'danger': return <XCircle className="h-6 w-6 text-red-500" />;
            case 'success': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
            default: return <Info className="h-6 w-6 text-blue-500" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'danger': return 'admin-btn-danger';
            case 'success': return 'admin-btn-primary'; // Using primary for success as well
            default: return 'admin-btn-primary';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[480px] overflow-hidden p-8 border-none shadow-2xl bg-white rounded-[32px]">
                <div className="flex flex-col items-center text-center">
                    {/* Top Icon Area */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <AlertTriangle
                                size={64}
                                strokeWidth={1.5}
                                className="text-[#FFB800] fill-[#FFB800]/10"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pt-2">
                                <div className="w-1.5 h-6 bg-[#12403C] rounded-full" />
                                <div className="w-1.5 h-1.5 bg-[#12403C] rounded-full absolute bottom-4" />
                            </div>
                        </div>
                    </div>

                    <DialogHeader className="p-0 text-center mb-4">
                        <DialogTitle className="text-[28px] font-normal text-[var(--admin-bg-dark)] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {title}
                        </DialogTitle>
                    </DialogHeader>

                    <DialogDescription className="text-[var(--admin-text-muted)] text-[15px] leading-relaxed mb-8 max-w-[300px]">
                        {description}
                    </DialogDescription>

                    <DialogFooter className="flex flex-row gap-3 w-full justify-center sm:justify-center sm:space-x-0">
                        <button
                            onClick={onClose}
                            disabled={isPending}
                            className="px-6 py-2.5 rounded-full border border-[#D1D1D1] text-[var(--admin-bg-dark)] text-[12px] font-bold tracking-wider uppercase hover:bg-gray-50 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isPending}
                            className={`px-6 py-2.5 rounded-full text-white text-[12px] font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98] ${type === 'danger' ? 'bg-[#991B1B]' : 'bg-[var(--admin-bg-dark)]'
                                }`}
                        >
                            {isPending ? '...' : confirmLabel}
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
