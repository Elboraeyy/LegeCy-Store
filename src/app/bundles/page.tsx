import { getPublicBundles } from '@/lib/actions/storefront-promotions';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { getGeneralSettings } from '@/lib/settings';

export const revalidate = 60; // Revalidate every minute

export default async function BundlesPage() {
    const [bundles] = await Promise.all([
        getPublicBundles(),
        getGeneralSettings()
    ]);

    return (
        <main className="min-h-screen bg-[#FCF8F3] pb-20">
             {/* Header */}
             <div className="bg-[#12403C] pt-32 pb-16 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#FCF8F3] mb-4">
                    Exclusive Bundles
                </h1>
                <p className="text-[#FCF8F3]/80 text-lg max-w-2xl mx-auto">
                    Curated sets designed to elevate your style. Save more when you buy together.
                </p>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-10">
                {bundles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {bundles.map((bundle) => (
                           <Link 
                                key={bundle.id}
                                href={bundle.type === 'MIX_AND_MATCH' ? `/bundles/build/${bundle.slug}` : `/bundles/${bundle.slug}`}
                                className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#12403C]/5"
                            >
                                <div className="relative h-[400px] bg-gray-100">
                                     {/* Image Grid */}
                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                        {bundle.images.slice(0,4).map((img: string, i: number) => (
                                            <div key={i} className="relative w-full h-full border-b border-r border-white/20">
                                                <Image
                                                    src={img}
                                                    alt={`Bundle item ${i}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-[#12403C]/10 group-hover:bg-[#12403C]/0 transition-colors duration-500" />
                                    
                                    {/* Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-block bg-[#d4af37] text-[#12403C] px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                                            {bundle.savings > 0 ? `Save EGP ${bundle.savings}` : 'Bundle Deal'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-2xl font-heading font-bold text-[#12403C] group-hover:text-[#d4af37] transition-colors mb-2">
                                                {bundle.name}
                                            </h2>
                                            <p className="text-gray-500 text-sm line-clamp-2">
                                                {bundle.description}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                                         <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm line-through">EGP {bundle.originalPrice}</span>
                                            <span className="text-2xl font-bold text-[#12403C]">EGP {bundle.bundlePrice}</span>
                                         </div>
                                         <span className="inline-flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                                            {bundle.type === 'MIX_AND_MATCH' ? 'Customize' : 'View Details'} <ChevronRight className="w-4 h-4" />
                                         </span>
                                    </div>
                                </div>
                           </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <p className="text-xl text-[#12403C]/60 mb-8">No active bundles at the moment.</p>
                        <Link href="/shop" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
