'use client';

import React from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/LandingPageNew/common';

export default function TravelWithZoPage() {
  return (
    <>
      <Header />
      <section className="bg-white min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Actions
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Every action shapes the reality we inhabit.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Through coordinated events, collaborative quests, and collective intention, 
            citizens co-create the world they want to live in.
          </p>
          <Link href="/become-a-founder" className="bg-[#ea5f52] text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:bg-[#f16e62] transition-colors inline-block">
            Start Your Journey
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
