import prisma from '@/lib/prisma';
import WizardClient from './WizardClient';

export default async function NewInvoiceWizardPage() {
    // Fetch suppliers for step 1
    const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    });

    return <WizardClient suppliers={suppliers} />;
}
