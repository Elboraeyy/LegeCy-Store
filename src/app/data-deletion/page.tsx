import { Metadata } from 'next';
import DataDeletionClient from './DataDeletionClient';

export const metadata: Metadata = {
  title: 'Data Deletion | LegaCy',
  description: 'Instructions for deleting your data from LegaCy',
};

export default function DataDeletionPage() {
  return <DataDeletionClient />;
}
