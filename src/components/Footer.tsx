import { getFooterSettings, getGeneralSettings, getSEOSettings } from "@/lib/settings";
import FooterClient from "./FooterClient";

export default async function Footer() {
  const [footer, general, seo] = await Promise.all([
    getFooterSettings(),
    getGeneralSettings(),
    getSEOSettings(),
  ]);

  return <FooterClient footer={footer} general={general} seo={seo} />;
}
