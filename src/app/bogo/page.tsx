import { getPublicBOGO } from '@/lib/actions/storefront-promotions';
import { getGeneralSettings } from '@/lib/settings';
import BogoClient from './BogoClient';

export const revalidate = 60; // Revalidate every minute

export default async function BogoPage() {
    const [bogos] = await Promise.all([
        getPublicBOGO(),
        getGeneralSettings()
    ]);

    return <BogoClient bogos={bogos} />;
}
