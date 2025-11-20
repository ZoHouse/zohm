'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoPassport, ZoPassportTest } from '@/components/desktop-dashboard';
import { usePrivyUser } from '@/hooks/usePrivyUser';

export default function PassportTestPage() {
  const { userProfile, isLoading } = usePrivyUser();
  const [testIsFounder, setTestIsFounder] = useState(false);
  const [testProgress, setTestProgress] = useState(50);
  const [testName, setTestName] = useState('Samurai');

  // Culture/interests data with image stickers
  const availableCultures = [
    { id: 'business', name: 'Business', image: '/Cultural Stickers/Business.png' },
    { id: 'design', name: 'Design', image: '/Cultural Stickers/Design.png' },
    { id: 'followyourheart', name: 'Follow Your Heart', image: '/Cultural Stickers/FollowYourHeart.png' },
    { id: 'food', name: 'Food', image: '/Cultural Stickers/Food.png' },
    { id: 'games', name: 'Games', image: '/Cultural Stickers/Game.png' },
    { id: 'health', name: 'Health & Fitness', image: '/Cultural Stickers/Health&Fitness.png' },
    { id: 'home', name: 'Home & Lifestyle', image: '/Cultural Stickers/Home&Lifestyle.png' },
    { id: 'law', name: 'Law & Order', image: '/Cultural Stickers/Law.png' },
    { id: 'literature', name: 'Literature', image: '/Cultural Stickers/Literature&Stories.png' },
    { id: 'music', name: 'Music & Entertainment', image: '/Cultural Stickers/Music&Entertainment.png' },
    { id: 'nature', name: 'Nature & Wildlife', image: '/Cultural Stickers/Nature&Wildlife.png' },
    { id: 'photography', name: 'Photography', image: '/Cultural Stickers/Photography.png' },
    { id: 'science', name: 'Science & Technology', image: '/Cultural Stickers/Science&Technology.png' },
    { id: 'spirituality', name: 'Spirituality', image: '/Cultural Stickers/Spiritual.png' },
    { id: 'sports', name: 'Sports', image: '/Cultural Stickers/Sport.png' },
    { id: 'tv', name: 'Television & Cinema', image: '/Cultural Stickers/Television&Cinema.png' },
    { id: 'travel', name: 'Travel & Adventure', image: '/Cultural Stickers/Travel&Adventure.png' },
  ];

  const [selectedCultures, setSelectedCultures] = useState<string[]>(['business', 'design', 'followyourheart']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const toggleCulture = (id: string) => {
    setSelectedCultures(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const removeCulture = (id: string) => {
    setSelectedCultures(prev => prev.filter(c => c !== id));
  };

  const handlePostOnX = async () => {
    if (!modalCardRef.current) return;
    
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
      
      const canvas = await html2canvas(modalCardRef.current, {
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
        link.download = `zo-world-declaration-${userProfile?.name?.replace(/\s+/g, '-').toLowerCase() || 'citizen'}.png`;
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
          
          // Close modal and show instruction
          setIsModalOpen(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 overflow-y-auto">
      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div className="max-w-[1400px] mx-auto pb-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">🎫 Zo Passport</h1>
          <p className="text-gray-500 text-sm md:text-base">Your complete identity in Zo World</p>
        </div>

        {/* Main Passport Layout - Clean 3-column design */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_400px] gap-6 md:gap-8 mb-12">
          {/* Left: Passport Card + Declaration Button */}
          <div className="flex flex-col gap-6 items-center lg:items-start">
            <ZoPassport />
            
            {/* Declaration Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-[234px] px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group border border-white/10"
              style={{ 
                fontFamily: 'Rubik, sans-serif',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <span>Declare Citizenship</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Center: General Information + Communication */}
          <div className="space-y-8">
            {/* General Information */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">General Information</h3>
              <div className="space-y-1">
                <InfoRow icon="✏️" label="Full Name" value={userProfile?.name || testName} />
                <InfoRow icon="👤" label="Short Bio" value={userProfile?.bio || `In short, call me ${testName.toLowerCase()}`} />
                <InfoRow icon="🎂" label="Born on" value="Aug 3, 1991" />
                <InfoRow icon="🎭" label="Gender" value="Male" />
                <InfoRow icon="📍" label="Location" value={userProfile?.location || "San Francisco"} />
              </div>
            </div>

            {/* Communication */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Communication</h3>
              <div className="space-y-1">
                <InfoRow icon="📧" label="Email" value={userProfile?.email || "gainngreen@gmail.com"} />
                <InfoRow icon="📱" label="Phone" value={userProfile?.phone || "+91 84699 64049"} />
              </div>
            </div>
          </div>

          {/* Right: For the Culture */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">For the Culture</h3>
            
            {/* $Zo Balance with Coin Animation */}
            <div 
              className="rounded-lg p-4 border border-white/10 mb-4"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Coin Video Animation */}
                  <div 
                    className="overflow-hidden rounded-lg"
                    style={{
                      width: '48px',
                      height: '48px',
                    }}
                  >
                    <video 
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    >
                      <source src="/videos/zo-coin.mp4" type="video/mp4" />
                    </video>
                  </div>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>
                    $Zo
                </span>
                </div>
                <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  {userProfile?.zo_balance?.toLocaleString() || '200'}
                </span>
              </div>
            </div>
            
            {/* Selected Cultures with Dropdown */}
            <div 
              className="rounded-lg p-4 border border-white/10" 
              ref={dropdownRef}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  Selected Cultures ({selectedCultures.length})
                </p>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors flex items-center gap-1 border border-white/10"
                  style={{ 
                    fontFamily: 'Rubik, sans-serif',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  + Add More
                </button>
              </div>

              {/* Selected Cultures (with remove button) */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {selectedCultures.length === 0 ? (
                  <p className="text-gray-500 text-xs py-2">No cultures selected yet</p>
                ) : (
                  availableCultures
                    .filter(c => selectedCultures.includes(c.id))
                    .map(culture => (
                      <div
                        key={culture.id}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2 group border"
                        style={{
                          fontFamily: 'Rubik, sans-serif',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          <img 
                            src={culture.image} 
                            alt={culture.name}
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-white">{culture.name}</span>
                        </span>
                        <button
                          onClick={() => removeCulture(culture.id)}
                          className="hover:scale-110 transition-transform text-white/70 hover:text-white"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))
                )}
              </div>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                      {availableCultures.map(culture => {
                        const isSelected = selectedCultures.includes(culture.id);
                        return (
                          <button
                            key={culture.id}
                            onClick={() => toggleCulture(culture.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm border ${
                              isSelected
                                ? 'text-white border-white/30'
                                : 'text-gray-400 hover:text-white border-white/5 hover:border-white/10'
                            }`}
                            style={{
                              fontFamily: 'Rubik, sans-serif',
                              backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <img 
                                src={culture.image} 
                                alt={culture.name}
                                className="w-5 h-5 object-contain"
                              />
                              {culture.name}
                            </span>
                            {isSelected && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-12"></div>

        {/* Test Controls Section - Collapsed by default */}
        <details className="mb-8">
          <summary className="cursor-pointer text-xl font-semibold text-white mb-4 hover:text-[#CFFF50] transition-colors">
            🔧 Test Controls & Component Preview
          </summary>
        
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 mt-4 border border-white/10">
          <h2 className="text-lg font-semibold text-gray-400 mb-6">Manual Controls for Testing</h2>
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white focus:outline-none focus:border-[#CFFF50]"
                placeholder="Enter name"
              />
            </div>

            {/* Progress Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile: {testProgress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={testProgress}
                onChange={(e) => setTestProgress(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#CFFF50]"
              />
            </div>

            {/* Founder Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <button
                onClick={() => setTestIsFounder(!testIsFounder)}
                className={`w-full px-4 py-2 rounded-md font-medium transition-all ${
                  testIsFounder
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {testIsFounder ? '⭐ Founder' : '👤 Citizen'}
              </button>
            </div>

            {/* View Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">View</label>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
                style={{ 
                  fontFamily: 'Rubik, sans-serif',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                ↑ Scroll to Live
              </button>
            </div>
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Test Passport */}
            <div className="flex justify-center">
              <ZoPassportTest
                profile={{
                  avatar: "/images/rank1.jpeg",
                  name: testName || "New Citizen",
                  isFounder: testIsFounder,
                }}
                completion={{
                  done: Math.floor(testProgress / 10),
                  total: 10,
                }}
              />
            </div>

            {/* Center: Mock Profile Data */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">General Information</h3>
              <InfoRow icon="✏️" label="Full Name" value={testName} />
              <InfoRow icon="👤" label="Short Bio" value={`In short, call me ${testName.toLowerCase()}`} />
              <InfoRow icon="🎂" label="Born on" value="Aug 3, 1991" />
              <InfoRow icon="🎭" label="Gender" value="Male" />
              <InfoRow icon="📍" label="Location" value="San Francisco" />

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">Communication</h3>
                <InfoRow icon="📧" label="Email" value="gainngreen@gmail.com" />
                <InfoRow icon="📱" label="Phone" value="+91 84699 64049" />
              </div>
            </div>

            {/* Right: Culture Selection - Same Dropdown Pattern */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">For the Culture</h3>
              <div 
                className="rounded-lg p-4 border border-white/10 mb-4"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Coin Video Animation */}
                    <div 
                      className="overflow-hidden rounded-lg"
                      style={{
                        width: '40px',
                        height: '40px',
                      }}
                    >
                      <video 
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ pointerEvents: 'none' }}
                      >
                        <source src="/videos/zo-coin.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <span className="text-white text-sm font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      $Zo
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Rubik, sans-serif' }}>2,011</span>
                </div>
              </div>

              {/* Same glassmorphism design as main section */}
              <div 
                className="rounded-lg p-4 border border-white/10"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                }}
              >
                <p className="text-sm text-gray-400 mb-3" style={{ fontFamily: 'Rubik, sans-serif' }}>
                  Selected Cultures ({selectedCultures.length})
                </p>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {selectedCultures.length === 0 ? (
                    <p className="text-gray-500 text-xs py-2">No cultures selected yet</p>
                  ) : (
                    availableCultures
                      .filter(c => selectedCultures.includes(c.id))
                      .map(culture => (
                        <div
                          key={culture.id}
                          className="px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2 border"
                          style={{
                            fontFamily: 'Rubik, sans-serif',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                          }}
                        >
                          <span className="flex items-center gap-1.5">
                            <img 
                              src={culture.image} 
                              alt={culture.name}
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-white">{culture.name}</span>
                          </span>
                          <button
                            onClick={() => removeCulture(culture.id)}
                            className="hover:scale-110 transition-transform text-white/70 hover:text-white"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </details>

        {/* Progression Flow Section */}
        <details className="mb-8" open>
          <summary className="cursor-pointer text-xl font-semibold text-white mb-4 hover:text-white/80 transition-colors">
            🚀 Progression Flow: Citizen → Founder
          </summary>
        <div 
          className="rounded-lg p-8 md:p-12 mt-4 border overflow-x-auto"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
            Your Journey in Zo World
          </h2>
          <p className="text-gray-400 text-center mb-8 md:mb-12">Evolve from Citizen to Founder</p>
          
          {/* Progression Path */}
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap md:flex-nowrap">
            {/* Stage 1: Citizen */}
            <div className="flex-shrink-0">
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-2 rounded-full text-sm font-bold text-white border mb-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontFamily: 'Rubik, sans-serif',
                  }}>
                  👤 CITIZEN
                </span>
                <p className="text-xs text-gray-500">Your starting point</p>
              </div>
              <div style={{ transform: 'scale(0.85)' }}>
                <ZoPassportTest
                  profile={{
                    avatar: "/images/rank2.jpeg",
                    name: "New Citizen",
                    isFounder: false,
                  }}
                  completion={{ done: 3, total: 10 }}
                />
              </div>
            </div>

            {/* Progression Arrow & Text */}
            <div className="flex flex-col items-center gap-4 px-4 md:px-8 flex-shrink-0">
              {/* Arrow */}
              <div className="text-4xl md:text-6xl text-white/30">→</div>
              
              {/* Progression Steps */}
              <div className="space-y-3 max-w-[280px]">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2">Complete your journey by:</p>
                </div>
                
                <div className="space-y-2">
                  <div 
                    className="px-4 py-2 rounded-lg text-xs text-white text-center border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    ✨ Participate in Zo World
                  </div>
                  <div 
                    className="px-4 py-2 rounded-lg text-xs text-white text-center border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    🎯 Complete Quests
                  </div>
                  <div 
                    className="px-4 py-2 rounded-lg text-xs text-white text-center border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    🌟 Earn Founder Status
                  </div>
                </div>
              </div>
              
              {/* Another Arrow */}
              <div className="text-4xl md:text-6xl text-white/30">→</div>
            </div>

            {/* Stage 2: Founder */}
            <div className="flex-shrink-0">
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-2 rounded-full text-sm font-bold text-white border mb-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    fontFamily: 'Rubik, sans-serif',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
                  }}>
                  ⭐ FOUNDER
                </span>
                <p className="text-xs text-gray-400">Elite status unlocked</p>
              </div>
              <div style={{ transform: 'scale(0.85)' }}>
                <ZoPassportTest
                  profile={{
                    avatar: "/images/rank1.jpeg",
                    name: "Founder",
                    isFounder: true,
                  }}
                  completion={{ done: 9, total: 10 }}
                />
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-6 text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
              Founder Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div 
                className="p-4 rounded-lg text-center border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-2xl mb-2">🎨</div>
                <p className="text-sm font-medium text-white mb-1">Exclusive Design</p>
                <p className="text-xs text-gray-400">Black passport with founder badge</p>
              </div>
              <div 
                className="p-4 rounded-lg text-center border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="text-2xl mb-2">👑</div>
                <p className="text-sm font-medium text-white mb-1">Elite Status</p>
                <p className="text-xs text-gray-400">Recognition across Zo World</p>
              </div>
              <div 
                className="p-4 rounded-lg text-center border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
              >
                <div className="text-2xl mb-2">🔓</div>
                <p className="text-sm font-medium text-white mb-1">Special Access</p>
                <p className="text-xs text-gray-400">Exclusive features & perks</p>
              </div>
            </div>
          </div>
        </div>
        </details>

        {/* Navigation */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/10"
            style={{ 
              fontFamily: 'Rubik, sans-serif',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* Declaration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-[1300px] w-full">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors z-10 shadow-lg"
            >
              ✕
            </button>

            {/* Declaration Card - Designed for 1200x675 (16:9) */}
            <div 
              ref={modalCardRef}
              className="relative w-[1200px] h-[675px] mx-auto border border-white/10"
              style={{ 
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
              }}
            >
              {/* Decorative Grid Overlay */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}></div>

              {/* Main Content */}
              <div className="relative h-full flex">
                {/* Left Side: Passport */}
                <div className="w-[500px] flex flex-col items-center justify-center p-12 border-r border-white/10">
                  <div style={{ transform: 'scale(1.3)' }}>
                    <ZoPassportTest
                      profile={{
                        avatar: userProfile?.pfp || "/images/rank1.jpeg",
                        name: userProfile?.name || testName,
                        isFounder: (userProfile?.founder_nfts_count || 0) > 0,
                      }}
                      completion={{
                        done: Math.floor(((userProfile?.name ? 1 : 0) + (userProfile?.bio ? 1 : 0) + (userProfile?.pfp ? 1 : 0) + (userProfile?.location ? 1 : 0) + (userProfile?.primary_wallet ? 1 : 0)) * 2),
                        total: 10,
                      }}
                    />
                  </div>
                </div>

                {/* Right Side: Declaration Text */}
                <div className="flex-1 flex flex-col items-center justify-center p-16">
                  {/* Zo Logo/Symbol */}
                  <div className="mb-8">
                    <div className="text-7xl font-black text-white tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Zo Zo
                    </div>
                  </div>

                  {/* Declaration Headline */}
                  <h1 className="text-5xl font-black text-white mb-8 text-center leading-tight">
                    I Declare Myself a<br/>Citizen of Zo World
                  </h1>

                  {/* Declaration Statement */}
                  <div className="space-y-4 max-w-[500px]">
                    <p className="text-xl text-gray-300 text-center leading-relaxed">
                      I commit to living with
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {['AGENCY', 'ALIGNMENT', 'CREATIVITY', 'SYMMETRY'].map((word) => (
                        <span 
                          key={word}
                          className="px-4 py-2 text-white font-bold text-sm rounded-full border"
                          style={{
                            fontFamily: 'Rubik, sans-serif',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Date & Signature */}
                  <div className="mt-12 text-center space-y-3">
                    <p className="text-gray-500 text-sm">{currentDate}</p>
                    <div className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                    <p className="text-white text-sm font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>
                      Signed by {userProfile?.name || testName}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-8 right-8">
                    <p className="text-gray-600 text-xs">zohm.world</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handlePostOnX}
                disabled={isGenerating}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                style={{ 
                  fontFamily: 'Rubik, sans-serif',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Declare on X</span>
                )}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/10"
                style={{ 
                  fontFamily: 'Rubik, sans-serif',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for info rows
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 group hover:bg-white/5 px-2 -mx-2 rounded-md transition-colors cursor-pointer">
      <span className="text-lg mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-white text-sm">{value}</p>
      </div>
      <button className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-white transition-all text-sm mt-1">
        →
      </button>
    </div>
  );
}
