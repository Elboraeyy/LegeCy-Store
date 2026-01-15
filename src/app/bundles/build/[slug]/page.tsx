import { getPublicBundleBySlug } from '@/lib/actions/storefront-promotions';
import { notFound, redirect } from 'next/navigation';
// Will create this component next
import { SmartBundleBuilder } from '@/components/bundles/SmartBundleBuilder';

export const revalidate = 60;

type Props = {
    params: { slug: string };
};

export default async function SmartBundlePage({ params }: Props) {
    const bundle = await getPublicBundleBySlug(params.slug);

    if (!bundle) {
        notFound();
    }

    if (bundle.bundleType !== 'MIX_AND_MATCH') {
        redirect(`/bundles/${params.slug}`);
    }

    return (
        <main className="min-h-screen bg-[#F5F0E3]">
            <SmartBundleBuilder bundle={bundle} />
        </main>
    );
}
