import { getPublicBundleBySlug } from '@/lib/actions/storefront-promotions';
import { FixedBundleClient } from '@/components/bundles/FixedBundleClient';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate every minute

type Props = {
    params: { slug: string };
};

export default async function BundleDetailsPage({ params }: Props) {
    const bundle = await getPublicBundleBySlug(params.slug);

    if (!bundle) {
        notFound();
    }

    // Redirect to build page if it's a Mix & Match bundle
    // (This ensures correct routing even if user manually types /bundles/ID)
    /* 
       Note: getPublicBundleBySlug returns the type. 
       Ideally, we'd handle redirection here, but Next.js redirects within a server component 
       are cleaner.
    */
    if (bundle.bundleType === 'MIX_AND_MATCH') {
         // Next.js Redirect
         const { redirect } = await import('next/navigation');
         redirect(`/bundles/build/${params.slug}`);
    }

    return (
        <main className="min-h-screen bg-[#F5F0E3]">
            <FixedBundleClient bundle={bundle} />
        </main>
    );
}
