import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy | LegaCy',
  description: 'How LegaCy collects, uses, and protects your personal data',
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
