import { getAddresses } from '@/lib/actions/user';
import AddressClient from './AddressClient';
import { getCurrentUser } from '@/lib/actions/auth';
import prisma from '@/lib/prisma';

export default async function AddressesPage() {
    const addresses = await getAddresses();
    const sessionUser = await getCurrentUser();

    let userDetails = null;
    if (sessionUser) {
        userDetails = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { name: true, email: true, phone: true }
        });
    }

    return <AddressClient initialAddresses={addresses} userDetails={userDetails} />;
}
