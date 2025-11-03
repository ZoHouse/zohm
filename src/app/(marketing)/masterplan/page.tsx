'use client';

import React from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/LandingPageNew/common';

export default function MasterplanPage() {
  return (
    <>
      <Header />
      
      {/* Introduction Section */}
      <section 
        className="w-full flex items-center justify-center"
        style={{
          minHeight: "70vh",
          background: "linear-gradient(356.51deg, #C3FCF1 -55.46%, #C2FBF4 -35.5%, #BFF6E9 -19.45%, #BBEFD7 -6.43%, #B5E5BC 11.36%, #ADD79B 25.24%, #A3C771 43.03%, #97B441 55.17%, #8BA00D 120.27%)"
        }}
      >
        <div className="max-w-6xl mx-auto px-8 flex md:flex-row flex-col items-center">
          <div className="md:w-1/2 text-white md:text-left text-center md:pt-0 pt-20">
            <h1 className="md:text-3xl text-2xl font-bold">Masterplan</h1>
            <h2 className="md:text-2xl text-lg mt-12 font-bold text-left">Insight</h2>
            <p className="mt-4 md:mt-8 text-left max-w-xl">
              Every action you take — to show up, to create, to connect, to care — sends ripples through your personal universe. Zohm turns those ripples into patterns — patterns of energy, experience, and evolution; visible proof that you are becoming who you are meant to be.
            </p>
            <p className="mt-6 text-left max-w-xl">
              Each quest is a breath in that metamorphosis. Each reward, a reflection of momentum. Each level, a mirror of your design unfolding.
            </p>
            <p className="mt-6 text-left max-w-xl">
              You don’t grow by chance. You grow by design. The symmetry you find at each stage of life is not coincidence — it’s coherence, the signal of a soul aligned with its purpose.
            </p>
            <p className="mt-6 text-left max-w-xl">Your signal in the noise. Zo Zo Zo.</p>
          </div>
          <div className="md:w-1/2 flex justify-center items-end relative h-96">
            <div className="text-9xl absolute bottom-0">🦄👥</div>
          </div>
        </div>
      </section>

      {/* Details Section 1 - Decentralized Operations */}
      <section className="max-w-6xl mx-auto py-16 px-8">
        <div className="flex md:flex-row flex-col items-center">
          <div className="md:w-2/3 text-black">
            <h2 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">
              Decentralized Operations
            </h2>
            <p className="mt-8 text-left max-w-xl">
              Our vision is alignment. Like a superconductor, when enough signals are directed toward a shared goal, the system reaches threshold — coherence emerges, and a network comes alive.
            </p>
            <p className="mt-6 text-left max-w-xl">
              We call this DOPE — Decentralized Operations: practical tools and protocols that turn collective intention into city‑scale change. DOPE unites three pillars:
            </p>
            <ul className="mt-6 list-disc pl-6 text-left max-w-xl space-y-2">
              <li>
                <span className="font-semibold">Futarchy for governance:</span> Prediction‑market‑based decision systems that link funding and outcomes to measurable foresight.
              </li>
              <li>
                <span className="font-semibold">Gamified Zohm protocol:</span> Quests, XP, and reputation systems that align incentives and participation.
              </li>
              <li>
                <span className="font-semibold">Execution tooling with AI:</span> Assistants and verification agents that help communities design, test, and execute ideas at scale.
              </li>
            </ul>
            <p className="mt-6 text-left max-w-xl">
              Together these layers allow citizens to coordinate, fund, and build with clarity and trust — cities that evolve by design, not by accident.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-center mt-8 md:mt-0">
            <div className="text-8xl">₿🦄</div>
          </div>
        </div>
      </section>

      {/* Details Section 2 - Community Led */}
      <section className="max-w-6xl mx-auto py-16 px-8">
        <div className="flex md:flex-row flex-col items-center">
          <div className="md:w-1/3 flex justify-center mb-8 md:mb-0 md:order-1 order-2">
            <div className="text-8xl">🙏</div>
          </div>
          <div className="md:w-2/3 text-black md:order-2 order-1">
            <h2 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">
              Community Led
            </h2>
            <p className="mt-8 text-left">
              Zohm is powered by its citizens — creators, travelers, builders, and dreamers. Our first public reveal on 2nd October 2021 honored Mahatma Gandhi’s vision of ground‑up economies and empowered communities.
              <br /><br />
              Futarcity continues that legacy: cities guided not by institutions but by the hearts of those who inhabit them. Zo enables that alignment — unifying intent, amplifying purpose, and letting every citizen follow their heart toward collective coherence.
            </p>
          </div>
        </div>
      </section>

      {/* Believers Section */}
      <section className="max-w-6xl mx-auto py-16 px-8">
        <h2 className="md:text-2xl text-xl font-bold mb-8 text-center">Believers</h2>
        <p className="text-center text-gray-700 max-w-3xl mx-auto mb-10">
          The future belongs to those who recognize that culture, code, and consciousness form the real infrastructure of civilization.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">💎</div>
            <h3 className="font-bold mb-2">Early Adopters</h3>
            <p className="text-sm text-gray-600">Pioneers testing the systems of tomorrow’s cities.</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="font-bold mb-2">Global Citizens</h3>
            <p className="text-sm text-gray-600">Explorers bridging digital and physical worlds.</p>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="font-bold mb-2">Innovators</h3>
            <p className="text-sm text-gray-600">Builders and artists giving shape to collective imagination.</p>
          </div>
        </div>
      </section>

      {/* Roadmap Forward Section */}
      <section className="pt-5 md:pt-14">
        <div 
          className="flex items-center justify-center w-full text-white z-10 h-20 text-center"
          style={{ background: "rgba(148, 174, 49, 1)" }}
        >
          <h2 className="md:text-2xl text-xl font-semibold">Roadmap Forward</h2>
        </div>

        {/* Founders of Zo World */}
        <div className="max-w-6xl mx-auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 text-black">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">Founders of Zo World</h3>
              <p className="mt-8 text-left">A cohort of early stewards bootstrapping culture, governance, and node relationships. Founders set the tone and seed the first treasury.</p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <div className="text-8xl">🦄🏛️</div>
            </div>
          </div>
        </div>

        {/* Citizens of Zo World */}
        <div className="max-w-6xl mx-auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 flex justify-center mb-8 md:mb-0 md:order-1 order-2">
              <div className="text-8xl">👥🌍</div>
            </div>
            <div className="md:w-1/2 text-black md:order-2 order-1">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">Citizens of Zo World</h3>
              <p className="mt-8 text-left">Participants who show up, complete quests, host events, and vote. Citizens earn XP, reputation, and influence through meaningful contribution.</p>
            </div>
          </div>
        </div>

        {/* Zo Nodes */}
        <div className="max-w-6xl mx-auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 text-black">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">Zo Nodes</h3>
              <p className="mt-8 text-left">Physical and virtual spaces — culture houses, hacker spaces, and co‑living nodes — hosting quests, gatherings, and local governance. These nodes are the scaffolding of Futarcity.</p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <div className="text-8xl">🏛️🌐</div>
            </div>
          </div>
        </div>

        {/* Zohm (The Platform) */}
        <div className="max-w-6xl mx-auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 text-black">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">Zohm (The Platform)</h3>
              <p className="mt-8 text-left">The interface connecting identity, events, rewards, and governance. Zohm is where citizens interact, coordinate, and design their shared reality.</p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <div className="text-8xl">🧭🧠</div>
            </div>
          </div>
        </div>

        {/* Futarchy */}
        <div className="max-w-6xl mx-auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 flex justify-center mb-8 md:mb-0 md:order-1 order-2">
              <div className="text-8xl">📈⚖️</div>
            </div>
            <div className="md:w-1/2 text-black md:order-2 order-1">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">Futarchy</h3>
              <p className="mt-8 text-left">Market‑informed governance enabling conditional funding and data‑driven decisions — a mechanism for aligning incentives with collective foresight.</p>
            </div>
          </div>
        </div>

        {/* $ZO TGE */}
        <div className="max-w-6xl mx_auto py-16 px-8">
          <div className="flex md:flex-row flex-col items-center">
            <div className="md:w-1/2 text-black">
              <h3 className="md:text-2xl text-lg font-bold md:leading-10 leading-7 text-left">$ZO TGE</h3>
              <p className="mt-8 text-left">The token generation event: the launch of Zohm’s economic layer that fuels coordination, funds public goods, and rewards contribution. $ZO is designed for sustainable growth and community ownership.</p>
            </div>
            <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
              <div className="text-8xl">🪙🚀</div>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      <section className="max-w-4xl mx-auto py-16 px-8 text-center">
        <h2 className="md:text-3xl text-2xl font-bold mb-6">Join Us On This Journey</h2>
        <p className="text-lg text-gray-700 mb-8">
          Together, we’re building the operating system of future cities — where presence becomes proof, quests create culture, and citizens own the networks they help grow.
        </p>
        <Link href="/" className="bg-[#ea5f52] text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-[#f16e62] transition-colors shadow-lg inline-block">
          Enter the Game
        </Link>
      </section>

      <Footer />
    </>
  );
}
