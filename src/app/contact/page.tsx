import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Concierge & Contact | Legacy Store",
  description: "Get in touch with our concierge team for inquiries and assistance.",
};

export default function Contact() {
  return <ContactClient />;
}
