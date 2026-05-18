'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BellRing } from 'lucide-react';

interface BackInStockModalProps {
    productId: string;
    available: number;
}

export function BackInStockModal({ productId, available }: BackInStockModalProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    if (available > 0) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    channel: 'email',
                    email,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.message === 'already_subscribed') {
                    toast.info("You're already on the waitlist!");
                } else {
                    toast.success("You're on the list! We'll email you when it's back.");
                }
                setOpen(false);
                setEmail('');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Something went wrong');
            }
        } catch {
            toast.error('Failed to subscribe. Please try again.');
        }
        
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2 border-dashed">
                    <BellRing className="w-4 h-4" />
                    Notify Me When Available
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Join the Waitlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        Enter your email address to verify your request. We&apos;ll notify you once this item is back in stock.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            placeholder="name@example.com"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Subscribing...' : 'Notify Me'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
