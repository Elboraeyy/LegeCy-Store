import { getPublicBOGO } from '@/lib/actions/storefront-promotions';
import Link from 'next/link';
import Image from 'next/image';
import { getGeneralSettings } from '@/lib/settings';

export const revalidate = 60; // Revalidate every minute

export default async function BogoPage() {
    const [bogos] = await Promise.all([
        getPublicBOGO(),
        getGeneralSettings()
    ]);

    return (
        <main className="min-h-screen bg-[#F5F0E3] pb-20">
             {/* Header */}
             <div className="bg-[#12403C] pt-32 pb-16 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#F5F0E3] mb-4">
                    Buy One, Get One
                </h1>
                <p className="text-[#F5F0E3]/80 text-lg max-w-2xl mx-auto">
                    Limited time offers. Purchase select items and receive exclusive gifts or discounts.
                </p>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-10">
                {bogos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bogos.map((deal) => (
                           <Link 
                                key={deal.id}
                                href={`/bogo/${deal.id}`}
                                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#12403C]/5"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                                    {deal.products[0]?.image ? (
                                        <Image
                                            src={deal.products[0].image}
                                            alt={deal.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#12403C] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                    
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center px-3 py-1 bg-[#d4af37] text-[#12403C] text-xs font-bold uppercase tracking-wider rounded shadow-lg">
                                            {deal.type === 'BUY_X_GET_Y_FREE' ? 'Free Gift' : `${deal.discount}% Off 2nd Item`}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        <h2 className="text-xl font-heading font-bold mb-1 leading-tight">{deal.name}</h2>
                                        <p className="text-white/80 text-sm">
                                            Buy {deal.buy}, Get {deal.get} {deal.type === 'BUY_X_GET_Y_FREE' ? 'Free' : 'Discounted'}
                                        </p>
                                    </div>
                                </div>
                           </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <p className="text-xl text-[#12403C]/60 mb-8">No active offers at the moment.</p>
                        <Link href="/shop" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
