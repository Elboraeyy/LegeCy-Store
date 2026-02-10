import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { fetchNewArrivals, fetchForYouProducts } from "@/lib/actions/shop";
import { getPublicFlashSales, getPublicBundles, getPublicBOGO } from "@/lib/actions/storefront-promotions";
import { HomeContentClient } from "./HomeContentClient";

export async function HomeContent() {
  const [homepage, general, newArrivals, forYouProducts, flashSales, bundles, bogos] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
    fetchNewArrivals(10),
    fetchForYouProducts(10),
    getPublicFlashSales(),
    getPublicBundles(),
    getPublicBOGO()
  ]);

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
      newArrivals={newArrivals}
      forYouProducts={forYouProducts}
      flashSales={flashSales}
      bundles={bundles}
      bogos={bogos}
    />
  );
}
