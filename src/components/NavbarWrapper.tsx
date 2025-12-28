import { getGeneralSettings, getHeaderSettings } from "@/lib/settings";
import NavbarClient from "./Navbar";

export default async function NavbarWrapper() {
  const [general, header] = await Promise.all([
    getGeneralSettings(),
    getHeaderSettings(),
  ]);

  return <NavbarClient generalSettings={general} headerSettings={header} />;
}

// For now, we export the header settings for use in ClientLayout if needed
export async function getNavSettings() {
  return {
    general: await getGeneralSettings(),
    header: await getHeaderSettings(),
  };
}
