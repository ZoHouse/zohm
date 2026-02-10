import type { Metadata } from 'next';
import VenuesClient from './VenuesClient';

export const metadata: Metadata = {
  title: 'Zo Events Master — Venue Directory',
  description: 'Browse 103 Zo World venue properties across India',
};

export default function VenuesPage() {
  return <VenuesClient />;
}
