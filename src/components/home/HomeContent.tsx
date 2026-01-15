import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { fetchFeaturedProducts, fetchNewArrivals } from "@/lib/actions/shop";
import { getPublicFlashSales, getPublicBundles, getPublicBOGO } from "@/lib/actions/storefront-promotions";
import { HomeContentClient } from "./HomeContentClient";

export async function HomeContent() {
  const [homepage, general, featuredProducts, newArrivals, flashSales, bundles, bogos] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
    fetchFeaturedProducts(10),
    fetchNewArrivals(10),
    getPublicFlashSales(),
    getPublicBundles(),
    getPublicBOGO()
  ]);

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals}
      flashSales={flashSales}
      bundles={bundles}
      bogos={bogos}
    />
  );
}
