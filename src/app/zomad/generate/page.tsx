'use client';

import React from 'react';
import { Header, Footer } from '@/components/LandingPageNew/common';

export default function ZomadGeneratePage() {
  return (
    <>
      <Header />
      <section className="bg-white min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get Your Zomad Avatar
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Create your unique identity in the Zo World.
          </p>
          <div className="bg-gray-100 rounded-2xl p-12 mb-8">
            <div className="w-48 h-48 mx-auto bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-6xl">🦄</span>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Avatar generation feature coming soon. Your Zomad avatar will represent you across all reality layers in the Zo network.
          </p>
          <button className="bg-[#ea5f52] text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:bg-[#f16e62] transition-colors">
            Generate Avatar
          </button>
        </div>
      </section>
      <Footer />
    </>
  );
}



