import { getSuppliers } from '@/lib/actions/procurement';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <div className="fade-in">
            <div className="admin-header">
                <div className="flex flex-col gap-4">
                    <Link href="/admin/procurement" className="admin-btn admin-btn-secondary w-fit">
                        ← Back
                    </Link>
                    <div>
                        <h1 className="admin-title">Suppliers</h1>
                        <p className="admin-subtitle">Active suppliers and vendors</p>
                    </div>
                </div>
                <Link href="/admin/procurement/suppliers/new" className="admin-btn admin-btn-primary">
                    <span className="text-lg">+</span> Add Supplier
                </Link>
            </div>

            <div className="admin-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Balance</th>
                                <th>Invoices</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td className="font-medium">{supplier.name}</td>
                                    <td>
                                        <div className="text-sm">{supplier.contactPerson}</div>
                                        <div className="text-xs text-muted">{supplier.email}</div>
                                    </td>
                                    <td className={Number(supplier.accountBalance) > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {Number(supplier.accountBalance).toLocaleString('en-EG', { style: 'currency', currency: supplier.currency })}
                                    </td>
                                    <td>{supplier._count.invoices}</td>
                                    <td>
                                        <Link href={`/admin/procurement/suppliers/${supplier.id}`} className="text-accent hover:underline text-sm">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-muted">
                                        No suppliers found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
