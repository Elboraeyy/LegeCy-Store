import { getHomepageSettings, getGeneralSettings } from "@/lib/settings";
import { fetchNewArrivals, fetchForYouProducts } from "@/lib/actions/shop";
import { getPublicFlashSales, getPublicBundles, getPublicBOGO } from "@/lib/actions/storefront-promotions";
import { HomeContentClient } from "./HomeContentClient";
import { fetchAllReviewsStats } from "@/lib/actions/reviews";
import fs from "fs";
import path from "path";

export async function HomeContent() {
  const [homepage, general, newArrivals, forYouProducts, flashSales, bundles, bogos, reviewStats] = await Promise.all([
    getHomepageSettings(),
    getGeneralSettings(),
    fetchNewArrivals(10),
    fetchForYouProducts(10),
    getPublicFlashSales(),
    getPublicBundles(),
    getPublicBOGO(),
    fetchAllReviewsStats()
  ]);

  // Read feedback images dynamically from public/Feedback
  let feedbackImages: string[] = [];
  try {
    const feedbackDir = path.join(process.cwd(), "public", "Feedback");
    if (fs.existsSync(feedbackDir)) {
      const files = fs.readdirSync(feedbackDir);
      feedbackImages = files
        .filter(file => /\.(png|jpe?g|webp|svg)$/i.test(file))
        .map(file => `/Feedback/${file}`);
    }
  } catch (error) {
    console.error("Error reading feedback directory:", error);
  }

  // Fallback in case of serverless file system restrictions
  if (feedbackImages.length === 0) {
    feedbackImages = [
      "Screenshot 2026-03-28 005004.png",
      "Screenshot 2026-03-28 010731.png",
      "Screenshot 2026-03-28 011603.png",
      "Screenshot 2026-03-28 012038.png",
      "Screenshot 2026-03-28 012845.png",
      "Screenshot 2026-03-28 012909.png",
      "Screenshot 2026-03-28 020454.png",
      "Screenshot 2026-03-28 020637.png",
      "Screenshot 2026-03-28 021557.png",
      "Screenshot 2026-03-28 022240.png",
      "WhatsApp Image 2026-03-21 at 12.51.58 AM.jpeg",
      "WhatsApp Image 2026-03-24 at 10.44.17 PM.jpeg",
      "WhatsApp Image 2026-03-28 at 1.09.23 AM.jpeg",
      "WhatsApp Image 2026-03-28 at 12.42.10 AM.jpeg",
      "WhatsApp Image 2026-03-28 at 12.47.07 AM.jpeg",
      "WhatsApp Image 2026-03-28 at 12.49.34 AM.jpeg",
      "WhatsApp Image 2026-03-28 at 12.49.34 AM2.jpeg",
      "WhatsApp Image 2026-05-24 at 2.15.57 PM (1).jpeg",
      "WhatsApp Image 2026-05-24 at 2.15.57 PM.jpeg",
      "WhatsApp Image 2026-05-24 at 2.17.01 PM.jpeg",
      "WhatsApp Image 2026-05-24 at 2.28.05 PM.jpeg",
      "WhatsApp Image 2026-05-24 at 2.29.11 PM.jpeg"
    ].map(file => `/Feedback/${file}`);
  }

  return (
    <HomeContentClient 
      homepage={homepage}
      storeName={general.storeName}
      newArrivals={newArrivals}
      forYouProducts={forYouProducts}
      flashSales={flashSales}
      bundles={bundles}
      bogos={bogos}
      feedbackImages={feedbackImages}
      reviewStats={reviewStats}
    />
  );
}
