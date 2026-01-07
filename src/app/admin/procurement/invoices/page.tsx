import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const invoices = await prisma.purchaseInvoice.findMany({
        orderBy: { createdAt: 'desc' },
        include: { supplier: true }
    });

    return (
        <div className="fade-in">
            <div className="admin-header">
                <div className="flex flex-col gap-4">
                    <Link href="/admin/procurement" className="admin-btn admin-btn-secondary w-fit">
                        ← Back
                    </Link>
                    <div>
                        <h1 className="admin-title">Purchase Invoices</h1>
                        <p className="admin-subtitle">Track incoming stock and payments</p>
                    </div>
                </div>
                <Link href="/admin/procurement/invoices/new" className="admin-btn admin-btn-primary">
                    <span className="text-lg">+</span> New Invoice
                </Link>
            </div>

            <div className="admin-card p-0 overflow-hidden">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Supplier</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id}>
                                <td className="font-medium">{inv.invoiceNumber}</td>
                                <td>{inv.supplier.name}</td>
                                <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge ${
                                        inv.status === 'POSTED' ? 'status-success' :
                                        inv.status === 'DRAFT' ? 'status-pending' : 'status-neutral'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td>{Number(inv.grandTotal).toFixed(2)}</td>
                                <td>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        inv.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                        inv.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {inv.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    <Link href={`/admin/procurement/invoices/${inv.id}`} className="text-accent hover:underline text-sm">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
