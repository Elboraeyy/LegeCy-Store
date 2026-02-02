import { Metadata } from 'next';
import CookiesClient from './CookiesClient';

export const metadata: Metadata = {
  title: 'Cookie Policy | LegaCy',
  description: 'How LegaCy uses cookies to enhance your shopping experience',
};

export default function CookiePolicyPage() {
  return <CookiesClient />;
}
