import prisma from '@/lib/prisma';
import WizardClient from './WizardClient';

export default async function NewInvoiceWizardPage() {
    // Fetch suppliers for step 1
    const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    });

    const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { name: 'Main Warehouse' }
    });

    // Fallback to any warehouse or throw specific error if none exists (Procurement requires warehouse)
    const warehouseId = defaultWarehouse?.id || (await prisma.warehouse.findFirst())?.id;

    if (!warehouseId) {
        return <div className="p-8 text-center text-red-500">System Error: No Warehouse found. Please verify setup.</div>;
    }

    return <WizardClient suppliers={suppliers} defaultWarehouseId={warehouseId} />;
}
