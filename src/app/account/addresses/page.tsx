import { getAddresses } from '@/lib/actions/user';
import AddressClient from './AddressClient';

export default async function AddressesPage() {
    const addresses = await getAddresses();
    return <AddressClient initialAddresses={addresses} />;
}
