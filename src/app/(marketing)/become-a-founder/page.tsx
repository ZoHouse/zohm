'use client';

import React from 'react';
import { Header, Footer } from '@/components/LandingPageNew/common';
import Introduction from '@/components/LandingPageNew/sections/become-a-founder/Introduction';
import Details from '@/components/LandingPageNew/sections/become-a-founder/Details';

export default function BecomeAFounderPage() {
  return (
    <>
      <Header />
      <section className="bg-white max-w-full overflow-hidden">
        <Introduction />
        <Details />
      </section>
      <Footer />
    </>
  );
}
