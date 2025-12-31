import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { fetchFeaturedProducts, fetchNewArrivals } from "@/lib/actions/shop";
import { HomeContentClient } from "./HomeContentClient";

export async function HomeContent() {
  const [homepage, general, featuredProducts, newArrivals] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
    fetchFeaturedProducts(10),
    fetchNewArrivals(10),
  ]);

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals}
    />
  );
}
