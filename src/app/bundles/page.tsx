import { getPublicBundles } from '@/lib/actions/storefront-promotions';
import { getGeneralSettings } from '@/lib/settings';
import BundlesClient from './BundlesClient';

export const revalidate = 60; // Revalidate every minute

export default async function BundlesPage() {
    const [bundles] = await Promise.all([
        getPublicBundles(),
        getGeneralSettings()
    ]);

    return <BundlesClient bundles={bundles} />;
}
