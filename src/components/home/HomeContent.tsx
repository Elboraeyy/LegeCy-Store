import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { HomeContentClient } from "./HomeContentClient";

export async function HomeContent() {
  const [homepage, general] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
  ]);

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
    />
  );
}
