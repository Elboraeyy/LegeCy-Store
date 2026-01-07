import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Fetch invoice with all related data
    const invoice = await prisma.purchaseInvoice.findUnique({
        where: { id },
        include: {
            supplier: true,
            items: true,
            attachments: true,
            auditLogs: {
                orderBy: { timestamp: 'desc' },
            },
            stockIn: true,
            ledgerEvents: true
        }
    });

    if (!invoice) notFound();

    return (
        <div className="fade-in max-w-6xl mx-auto pb-12">
            
            {/* Header */}
            <div className="admin-header">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/procurement/invoices" className="text-muted hover:text-foreground">← Back</Link>
                        <h1 className="admin-title">Invoice {invoice.invoiceNumber}</h1>
                        <span className={`status-badge ${
                             invoice.status === 'POSTED' ? 'status-success' :
                             invoice.status === 'DRAFT' ? 'status-pending' : 'status-neutral'
                        }`}>
                            {invoice.status}
                        </span>
                    </div>
                    <p className="admin-subtitle mt-1">
                        Supplier: <Link href={`/admin/procurement/suppliers/${invoice.supplierId}`} className="text-accent underline">{invoice.supplier.name}</Link>
                    </p>
                </div>
                
                <div className="flex gap-2">
                    {invoice.status === 'DRAFT' && (
                        <Link href={`/admin/procurement/invoices/${invoice.id}/edit`} className="admin-btn-primary">
                            Edit Draft
                        </Link>
                    )}
                     {/* For POSTED invoices, maybe "Download PDF" or "Payment" button */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content: Items Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="admin-card p-0 overflow-hidden">
                        <div className="p-4 border-b bg-base-100">
                             <h3 className="font-bold">Line Items</h3>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Ref</th>
                                    <th>Description</th>
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Unit Cost</th>
                                    <th className="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="text-xs text-muted font-mono">{item.variantId?.slice(0,6) || '-'}</td>
                                        <td>{item.description}</td>
                                        <td className="text-right">{item.quantity}</td>
                                        <td className="text-right">{Number(item.unitCost).toFixed(2)}</td>
                                        <td className="text-right">{Number(item.totalCost).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-base-200/50 font-bold">
                                <tr>
                                    <td colSpan={4} className="text-right">Subtotal</td>
                                    <td className="text-right">{Number(invoice.subtotal).toFixed(2)}</td>
                                </tr>
                                {Number(invoice.taxTotal) > 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-right">Tax</td>
                                        <td className="text-right">{Number(invoice.taxTotal).toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr className="text-lg">
                                    <td colSpan={4} className="text-right">Grand Total</td>
                                    <td className="text-right">{Number(invoice.grandTotal).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Timeline / Audit Log */}
                    <div className="admin-card">
                        <h3 className="font-bold mb-4">Activity Log</h3>
                        <ul className="space-y-4">
                            {invoice.auditLogs.map(log => (
                                <li key={log.id} className="flex gap-3 text-sm">
                                    <div className="text-muted w-32 shrink-0">{new Date(log.timestamp).toLocaleString()}</div>
                                    <div>
                                        <span className="font-medium">{log.actorName || 'System'}</span>
                                        <span className="text-muted mx-1">{log.action}:</span>
                                        <span>{log.details}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <div className="admin-card">
                        <h3 className="font-bold mb-3 text-sm uppercase text-muted">Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted">Issue Date</span>
                                <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Due Date</span>
                                <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Payment Status</span>
                                <span className={`badge ${
                                    invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>{invoice.paymentStatus}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Ledger Impact (if posted) */}
                    {invoice.status === 'POSTED' && (
                        <div className="admin-card bg-slate-50 dark:bg-slate-900/50 border-slate-200">
                            <h3 className="font-bold mb-3 text-sm uppercase text-muted">Financial Impact</h3>
                            {invoice.ledgerEvents.length > 0 ? (
                                <div className="space-y-2 text-xs font-mono">
                                    {invoice.ledgerEvents.map(event => (
                                        <div key={event.id} className="p-2 border rounded bg-white dark:bg-black">
                                            <div className="flex justify-between text-muted border-b pb-1 mb-1">
                                                <span>{event.type}</span>
                                                <span>{Number(event.amount).toFixed(2)}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="block text-green-600">DR {event.debitAccount}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-red-600">CR {event.creditAccount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted">No ledger events found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
