'use client';

import Link from 'next/link';

export default function CouponsPage() {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Coupons</h1>
                    <p className="text-gray-500">Manage discount codes and promotions</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/config" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        Settings
                    </Link>
                    <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                        + New Coupon
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border text-center py-20">
                <div className="text-4xl mb-4">🎫</div>
                <h3 className="text-xl font-medium mb-2">No Active Coupons</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Create discount codes to boost sales. You can configure global coupon settings in the configuration menu.
                </p>
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                    Create First Coupon
                </button>
            </div>
            
            {/* Logic to link to actual Coupon model will be added here */}
        </div>
    );
}
