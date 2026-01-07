import Link from 'next/link';

export default function ProcurementPage() {
    return (
        <div className="fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Procurement</h1>
                    <p className="admin-subtitle">Manage suppliers, invoices, and stock intake</p>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                <Link href="/admin/procurement/suppliers" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2">Suppliers</h3>
                    <p className="text-muted text-sm">Manage supplier database and contacts</p>
                </Link>

                <Link href="/admin/procurement/invoices" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2">Invoices</h3>
                    <p className="text-muted text-sm">View purchase invoices and draft new ones</p>
                </Link>

                <Link href="/admin/procurement/invoices/new" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2 text-primary">New Stock Intake</h3>
                    <p className="text-muted text-sm">Register new stock from supplier invoice</p>
                </Link>
            </div>
        </div>
    );
}
