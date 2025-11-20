'use client';

import React, { useState, useRef } from 'react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { ZoPassportTest } from '@/components/desktop-dashboard';

export default function PreambleTestPage() {
  const { userProfile } = usePrivyUser();
  const [signatureName, setSignatureName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleTwitterShare = async () => {
    if (!signatureName.trim()) {
      alert('Please enter your name first');
      return;
    }
    
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Load html2canvas from CDN
      if (!(window as any).html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      const html2canvas = (window as any).html2canvas;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        width: 1200,
        height: 675,
      });
      
      // Download the card
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `zo-world-declaration-${signatureName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        // Then open X with pre-filled text after a short delay
        setTimeout(() => {
          const tweetText = `I have declared myself a citizen of Zo World! 🌍✨

I commit to AGENCY, ALIGNMENT, CREATIVITY & FLOW.

Join me: https://zohm.world

#ZoWorld #ZoProtocol #LifeDesign`;

          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
          window.open(twitterUrl, '_blank', 'width=550,height=420');
          
          // Show instruction after opening Twitter
          setTimeout(() => {
            alert('✅ Card downloaded!\n\n📎 Now click the image button in X and attach the downloaded image before posting.');
          }, 1000);
        }, 500);
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate card. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Declaration Card Generator
          </h1>
          <p className="text-gray-500">
            Create your Zo World citizen declaration card and share it on X
          </p>
        </div>

        {/* Name Input (Outside Card) */}
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Your Full Name
          </label>
          <input
            type="text"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder={userProfile?.name || "Enter your full name"}
            className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#CFFF50] transition-colors"
          />
        </div>

        {/* Declaration Card */}
        <div 
          ref={cardRef}
          className="bg-[#0A0A0A] rounded-lg p-10 border border-white/10 mb-8"
          style={{ aspectRatio: '16/9', maxWidth: '1200px' }}
        >
          <div className="h-full grid grid-cols-[280px_1fr] gap-10">
            {/* Left: Passport */}
            <div className="flex flex-col items-center justify-center">
              <ZoPassportTest
                profile={{
                  avatar: userProfile?.pfp || "/images/rank1.jpeg",
                  name: signatureName || "Your Name",
                  isFounder: (userProfile?.founder_nfts_count || 0) > 0,
                }}
                completion={{
                  done: 8,
                  total: 10,
                }}
              />
            </div>

            {/* Right: Declaration */}
            <div className="flex flex-col justify-center space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Preamble to the Zo Protocol
                </h2>
                <p className="text-base text-gray-400">My Declaration</p>
              </div>

              {/* Declaration Text */}
              <div className="space-y-4 text-white text-sm leading-relaxed">
                <p>
                  I, <span className="text-[#CFFF50] font-semibold">{signatureName.toUpperCase() || "AN AWAKENED CITIZEN"}</span>, solemnly resolve to constitute my reality within the Zo Protocol and secure for myself:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black rounded-md p-3 border border-white/10">
                    <p className="text-[#CFFF50] font-semibold text-xs mb-0.5">AGENCY</p>
                    <p className="text-gray-400 text-xs">to author my life</p>
                  </div>
                  <div className="bg-black rounded-md p-3 border border-white/10">
                    <p className="text-[#CFFF50] font-semibold text-xs mb-0.5">ALIGNMENT</p>
                    <p className="text-gray-400 text-xs">of intention and action</p>
                  </div>
                  <div className="bg-black rounded-md p-3 border border-white/10">
                    <p className="text-[#CFFF50] font-semibold text-xs mb-0.5">CREATIVITY</p>
                    <p className="text-gray-400 text-xs">for boundless transformation</p>
                  </div>
                  <div className="bg-black rounded-md p-3 border border-white/10">
                    <p className="text-[#CFFF50] font-semibold text-xs mb-0.5">FLOW</p>
                    <p className="text-gray-400 text-xs">for synchronicity and purpose</p>
                  </div>
                </div>

                <p className="text-base font-semibold">
                  IN THIS MOMENT, I do HEREBY AFFIRM AND ADOPT THIS PROTOCOL.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-[#CFFF50] text-lg font-semibold">
                  {signatureName || "__________________"}
                </p>
                <p className="text-gray-500 text-xs mt-1">{currentDate}</p>
              </div>

              {/* Branding */}
              <div className="pt-2">
                <p className="text-gray-600 text-xs">zohm.world • #ZoWorld</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="max-w-md">
          <button
            onClick={handleTwitterShare}
            disabled={!signatureName.trim() || isGenerating}
            className={`w-full px-6 py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-semibold rounded-md transition-colors flex items-center justify-center gap-2 text-lg ${
              (!signatureName.trim() || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Preparing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Post on X
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10 max-w-2xl">
          <h3 className="text-white font-semibold mb-3">📝 How it works:</h3>
          <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
            <li>Enter your full name above</li>
            <li>Click "Post on X"</li>
            <li>Your declaration card downloads automatically</li>
            <li>X opens with pre-filled text</li>
            <li>Click the image button (📎) in X and attach the downloaded image</li>
            <li>Post to declare yourself a citizen of Zo World! 🎉</li>
          </ol>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="/passport-test"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-md transition-colors text-sm"
          >
            View Passport
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-md transition-colors text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
