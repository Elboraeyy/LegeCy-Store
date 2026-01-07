import prisma from '@/lib/prisma';

import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
            accountsPayable: {
                where: { status: 'OPEN' }
            }
        }
    });

    if (!supplier) notFound();

    const totalUnpaid = supplier.accountsPayable.reduce((sum, ap) => sum + Number(ap.amount), 0);

    return (
        <div className="fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{supplier.name}</h1>
                    <div className="flex gap-2 text-sm text-muted">
                        <span>{supplier.contactPerson}</span>
                        <span>•</span>
                        <span>{supplier.email}</span>
                        <span>•</span>
                        <span>{supplier.phone}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                     <Link href="/admin/procurement/suppliers" className="admin-btn-secondary">Back</Link>
                </div>
            </div>

            <div className="admin-grid admin-grid-responsive mb-8">
                 {/* Financial Stats */}
                 <div className="admin-card">
                    <div className="stat-label">Account Balance (AP)</div>
                    <div className={`stat-value ${totalUnpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalUnpaid.toLocaleString('en-EG', { style: 'currency', currency: supplier.currency })}
                    </div>
                    <div className="text-xs text-muted mt-1">Amount owed to supplier</div>
                 </div>

                 <div className="admin-card">
                    <div className="stat-label">Total Invoices</div>
                    <div className="stat-value">{supplier.invoices.length}</div>
                 </div>
            </div>

            <div className="admin-card">
                <h3 className="font-bold mb-4">Recent Invoices</h3>
                <table className="admin-table">
                     <thead>
                         <tr>
                             <th>Invoice #</th>
                             <th>Date</th>
                             <th>Status</th>
                             <th>Amount</th>
                             <th>Payment</th>
                             <th>Action</th>
                         </tr>
                     </thead>
                     <tbody>
                         {supplier.invoices.map(inv => (
                             <tr key={inv.id}>
                                 <td>{inv.invoiceNumber}</td>
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
                                 <td>{inv.paymentStatus}</td>
                                 <td>
                                     <Link href={`/admin/procurement/invoices/${inv.id}`} className="text-accent hover:underline">
                                         View
                                     </Link>
                                 </td>
                             </tr>
                         ))}
                         {supplier.invoices.length === 0 && (
                             <tr><td colSpan={6} className="text-center text-muted py-4">No recent invoices</td></tr>
                         )}
                     </tbody>
                </table>
            </div>
        </div>
    );
}
