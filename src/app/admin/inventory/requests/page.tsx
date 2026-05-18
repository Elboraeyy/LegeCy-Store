import { redirect } from 'next/navigation';

// Redirect old route to the new unified route
export default function InventoryRequestsRedirect() {
    redirect('/admin/restock-requests');
}
