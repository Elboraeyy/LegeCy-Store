'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { FlashSalesSection } from './FlashSalesSection'; // We reuse the robust internal logic or adapt it

export interface FlashSale {
    id: string;
    name: string;
    endDate: Date;
    products: {
        id: string;
        name: string;
        image: string | null;
        originalPrice: number;
        salePrice: number;
    }[];
}

export interface BOGODeal {
    id: string;
    name: string;
    type: string;
    buy: number;
    get: number;
    discount: number;
    products: {
        image: string | null;
    }[];
}

export interface Bundle {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    type: string;
    bundlePrice: number;
    originalPrice: number;
    savings: number;
    images: string[];
}

// Types matching the props passed from HomeContentClient
type Props = {
    flashSales: FlashSale[];
    bogos: BOGODeal[];
    bundles: Bundle[];
};

export function PromotionsHub({ flashSales, bogos, bundles }: Props) {
    // If no promotions at all, don't render
    if (!flashSales?.length && !bogos?.length && !bundles?.length) return null;

    return (
        <div className="promotions-hub-container flex flex-col gap-12 md:gap-20 py-12 md:py-20 relative bg-[#FCF8F3]/5">
             <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]"></div>

            {/* 1. Flash Sales Section */}
            {flashSales && flashSales.length > 0 && (
                <div className="relative z-10">
                    <FlashSalesSection sales={flashSales} />
                </div>
            )}

            {/* 2. BOGO Section */}
            {bogos && bogos.length > 0 && (
                <section className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#12403C] mb-2">
                                Buy One, Get One
                            </h2>
                            <p className="text-[#4A6B68] text-lg max-w-xl">
                                Double the luxury. Exclusive offers on our premium collection.
                            </p>
                        </div>
                        <Link href="/bogo" className="group inline-flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-widest hover:text-[#b5952f] transition-colors pb-1 border-b-2 border-[#d4af37]/20 hover:border-[#d4af37]">
                            View All Offers <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bogos.map((deal) => (
                            <BogoCard key={deal.id} deal={deal} />
                        ))}
                    </div>
                </section>
            )}

            {/* 3. Bundles Section */}
            {bundles && bundles.length > 0 && (
                <section className="container mx-auto px-4 relative z-10">
                     <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#12403C] mb-2">
                                Curated Bundles
                            </h2>
                            <p className="text-[#4A6B68] text-lg max-w-xl">
                                Hand-picked sets. Mix, match, and save on complete looks.
                            </p>
                        </div>
                        <Link href="/bundles" className="group inline-flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-widest hover:text-[#b5952f] transition-colors pb-1 border-b-2 border-[#d4af37]/20 hover:border-[#d4af37]">
                            View All Bundles <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {bundles.map((bundle) => (
                           <BundleCard key={bundle.id} bundle={bundle} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function BogoCard({ deal }: { deal: BOGODeal }) {
    const mainProduct = deal.products[0];
    if (!mainProduct) return null;

    return (
        <div className="relative group overflow-hidden rounded-xl bg-white shadow-sm border border-[#12403C]/5 hover:shadow-xl transition-all duration-500">
             <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                 <span className="inline-flex items-center px-3 py-1 bg-[#12403C] text-[#FCF8F3] text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    {deal.type === 'BUY_X_GET_Y_FREE' ? 'Free Gift' : `${deal.discount}% Off 2nd Item`}
                 </span>
             </div>

            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                 {mainProduct.image ? (
                    <Image
                        src={mainProduct.image}
                        alt={deal.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                 )}
                 {/* Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#12403C]/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
                 <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                     <h3 className="text-2xl font-heading font-bold mb-1 leading-tight">{deal.name}</h3>
                     <p className="text-white/80 text-sm mb-4">
                        Buy {deal.buy}, Get {deal.get} {deal.type === 'BUY_X_GET_Y_FREE' ? 'Free' : 'Discounted'}
                     </p>
                     
                     <Link href={`/bogo/${deal.id}`} className="w-full block py-3 bg-white text-[#12403C] text-center font-bold uppercase tracking-widest text-xs rounded hover:bg-[#d4af37] hover:text-white transition-colors">
                        Shop Deal
                     </Link>
                 </div>
            </div>
        </div>
    );
}

function BundleCard({ bundle }: { bundle: Bundle }) {
    return (
        <div className="relative group bg-white rounded-2xl overflow-hidden border border-[#12403C]/10 hover:border-[#d4af37]/50 transition-all duration-500 shadow-sm hover:shadow-2xl flex flex-col md:flex-row h-full">
            {/* Visual Side */}
            <div className="w-full md:w-1/2 relative min-h-[300px] bg-gray-100 overflow-hidden">
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
                    {bundle.images.length < 4 && Array.from({ length: 4 - bundle.images.length }).map((_, i) => (
                         <div key={`empty-${i}`} className="bg-[#FCF8F3]/20" />
                    ))}
                </div>
                
                <div className="absolute inset-0 bg-[#12403C]/20 group-hover:bg-transparent transition-colors duration-500" />
            </div>

            {/* Content Side */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white relative">
                 <div className="absolute top-6 right-6 text-right">
                    <span className="block text-2xl font-bold text-[#d4af37] font-heading">
                        {bundle.savings > 0 ? `Save EGP ${bundle.savings}` : 'Best Value'}
                    </span>
                 </div>

                 <div className="mb-6 mt-8">
                     <span className="text-[#9CA3AF] text-xs font-bold uppercase tracking-[0.2em] mb-2 block">
                        {bundle.type === 'MIX_AND_MATCH' ? 'Build Your Own' : 'Curated Set'}
                     </span>
                     <h3 className="text-3xl font-heading font-bold text-[#12403C] mb-3 leading-tight">
                         {bundle.name}
                     </h3>
                     <p className="text-gray-500 text-sm leading-relaxed mb-6">
                         {bundle.description || "The perfect combination for a refined lifestyle."}
                     </p>

                     <div className="flex items-baseline gap-3 mb-8">
                         <span className="text-3xl font-bold text-[#12403C]">EGP {bundle.bundlePrice}</span>
                         <span className="text-lg text-gray-400 line-through">EGP {bundle.originalPrice}</span>
                     </div>
                 </div>

                 <Link 
                    href={bundle.type === 'MIX_AND_MATCH' ? `/bundles/build/${bundle.slug}` : `/bundles/${bundle.slug}`}
                    className="w-full py-4 bg-[#12403C] text-[#FCF8F3] text-center font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-[#d4af37] hover:text-[#12403C] transition-all duration-300 shadow-md transform group-hover:translate-y-[-2px]"
                 >
                    {bundle.type === 'MIX_AND_MATCH' ? 'Build This Bundle' : 'View Bundle'}
                 </Link>
            </div>
        </div>
    );
}
