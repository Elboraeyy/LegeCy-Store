import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { fetchFeaturedProducts, fetchNewArrivals } from "@/lib/actions/shop";
import { getPublicFlashSales, getPublicBundles } from "@/lib/actions/storefront-promotions";
import { HomeContentClient } from "./HomeContentClient";

export async function HomeContent() {
  const [homepage, general, featuredProducts, newArrivals, flashSales, bundles] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
    fetchFeaturedProducts(10),
    fetchNewArrivals(10),
    getPublicFlashSales(),
    getPublicBundles()
  ]);

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals}
      flashSales={flashSales}
      bundles={bundles}
    />
  );
}
