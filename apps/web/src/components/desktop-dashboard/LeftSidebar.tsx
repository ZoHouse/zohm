'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, X, Pencil } from 'lucide-react';
import { getCultureDisplayName, getCultureIcon, getAllCultures } from '@/lib/cultures';
import { PrivyUserProfile } from '@/types/privy';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur, DashboardAssets } from '@/styles/dashboard-tokens';
import ZoPassport from './ZoPassport';

interface LeftSidebarProps {
  userProfile: PrivyUserProfile | null;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userProfile }) => {
  const [balance, setBalance] = React.useState(0);
  const [vibeScore, setVibeScore] = React.useState(99); // Default 99
  const [selectedCultures, setSelectedCultures] = React.useState<string[]>([]);
  const [showCultureDropdown, setShowCultureDropdown] = React.useState(false);
  const [isEditingBio, setIsEditingBio] = React.useState(false);
  const [bioText, setBioText] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const bioTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const userId = userProfile?.id;

  // Fetch token balance
  React.useEffect(() => {
    if (!userId) return;

    async function fetchBalance() {
      try {
        const response = await fetch(`/api/users/${userId}/progress`, {
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.quests?.zo_points !== undefined) {
            setBalance(data.quests.zo_points);
          }
        }
      } catch (error) {
        console.warn('Could not fetch balance:', error);
      }
    }

    fetchBalance();
    const intervalId = setInterval(fetchBalance, 3000);
    return () => clearInterval(intervalId);
  }, [userId]);

  // Fetch vibe score
  React.useEffect(() => {
    if (!userId) return;

    async function fetchVibeScore() {
      try {
        const response = await fetch(`/api/vibe/${userId}`, {
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.success && data?.data?.score !== undefined) {
            setVibeScore(data.data.score);
          }
        }
      } catch (error) {
        console.warn('Could not fetch vibe score:', error);
      }
    }

    fetchVibeScore();
    // Update vibe score every 30 seconds
    const intervalId = setInterval(fetchVibeScore, 30000);
    return () => clearInterval(intervalId);
  }, [userId]);

  // Initialize selected cultures from user profile
  React.useEffect(() => {
    if (userProfile?.culture) {
      const cultures = userProfile.culture.split(',').map(c => c.trim()).filter(Boolean);
      setSelectedCultures(cultures);
    }
  }, [userProfile?.culture]);

  // Initialize bio from user profile
  React.useEffect(() => {
    if (userProfile?.bio) {
      setBioText(userProfile.bio);
    }
  }, [userProfile?.bio]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCultureDropdown(false);
      }
    }

    if (showCultureDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCultureDropdown]);

  const handleSaveBio = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bioText }),
      });
      
      if (response.ok) {
        setIsEditingBio(false);
      } else {
        console.error('Failed to update bio');
      }
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  const handleAddCulture = async (culture: string) => {
    if (!selectedCultures.includes(culture) && userId) {
      const newCultures = [...selectedCultures, culture];
      setSelectedCultures(newCultures);
      
      // Save to Supabase
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ culture: newCultures.join(', ') }),
        });
        
        if (!response.ok) {
          console.error('Failed to update cultures');
          // Revert on error
          setSelectedCultures(selectedCultures);
        }
      } catch (error) {
        console.error('Error updating cultures:', error);
        // Revert on error
        setSelectedCultures(selectedCultures);
      }
    }
    // Don't close dropdown - allow multiple selections
  };

  const handleRemoveCulture = async (culture: string) => {
    if (!userId) return;
    
    const newCultures = selectedCultures.filter(c => c !== culture);
    setSelectedCultures(newCultures);
    
    // Save to Supabase
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ culture: newCultures.join(', ') }),
      });
      
      if (!response.ok) {
        console.error('Failed to update cultures');
        // Revert on error
        setSelectedCultures(selectedCultures);
      }
    } catch (error) {
      console.error('Error updating cultures:', error);
      // Revert on error
      setSelectedCultures(selectedCultures);
    }
  };

  const availableCultures = getAllCultures().filter(c => !selectedCultures.includes(c));

  const handleCopyWallet = () => {
    if (userProfile?.wallets?.[0]?.address) {
      navigator.clipboard.writeText(userProfile.wallets[0].address);
    }
  };

  const primaryWallet = userProfile?.wallets?.[0]?.address;
  const shortWallet = primaryWallet ? `0x...${primaryWallet?.slice(-4)}` : '';

  // Format balance with K suffix if over 1000
  const formatBalance = (bal: number) => {
    if (bal >= 1000) {
      return `${(bal / 1000).toFixed(2)}K`;
    }
    return bal.toString();
  };

  return (
    <>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex flex-col w-[360px] flex-shrink-0" style={{ gap: DashboardSpacing.xl }}>
      {/* Profile Card */}
      <div 
        className="flex flex-col border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: DashboardColors.background.primary,
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          gap: DashboardSpacing.xl,
        }}
      >
        {/* Founder + Citizen IDs */}
        <div className="flex items-center justify-center w-full">
          <div
            className="flex items-center px-1 py-1"
            style={{
              gap: DashboardSpacing.xs,
              borderRadius: DashboardRadius.pill,
            }}
          >
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.fontWeight.medium,
              fontSize: DashboardTypography.size.smallMedium.fontSize,
              lineHeight: DashboardTypography.size.smallMedium.lineHeight,
              color: DashboardColors.text.quaternary,
            }}>Citizen</p>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.fontWeight.medium,
              fontSize: DashboardTypography.size.smallMedium.fontSize,
              lineHeight: DashboardTypography.size.smallMedium.lineHeight,
              color: DashboardColors.text.primary,
            }}>#35235</p>
          </div>
        </div>

        {/* Zo Passport Card */}
        <div className="flex flex-col items-center justify-center" style={{ gap: DashboardSpacing.md }}>
          <ZoPassport />
          
          {/* View Passport Button */}
          <Link 
            href="/zopassport"
            className="px-6 py-2.5 rounded-lg transition-all hover:opacity-90 text-center border border-white/10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: `blur(${DashboardBlur.medium})`,
              WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
            }}
          >
            <span style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontSize: DashboardTypography.size.small.fontSize,
              fontWeight: DashboardTypography.fontWeight.medium,
              color: DashboardColors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              View Passport
            </span>
          </Link>
        </div>

        {/* User Info */}
        <div className="flex flex-col w-full" style={{ gap: DashboardSpacing.xl }}>
          {/* Bio */}
          <div className="flex flex-col items-center justify-center" style={{ gap: DashboardSpacing.sm }}>
            {isEditingBio ? (
              <div className="w-full flex flex-col" style={{ gap: DashboardSpacing.sm }}>
                <textarea
                  ref={bioTextareaRef}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                  className="w-full resize-none border border-solid focus:outline-none focus:border-white/40 transition-colors"
                  style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontWeight: DashboardTypography.size.small.fontWeight,
                    fontSize: DashboardTypography.size.small.fontSize,
                    lineHeight: DashboardTypography.size.small.lineHeight,
                    letterSpacing: DashboardTypography.size.small.letterSpacing,
                    color: DashboardColors.text.primary,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.16)',
                    borderRadius: DashboardRadius.sm,
                    padding: DashboardSpacing.md,
                    minHeight: '80px',
                  }}
                />
                <div className="flex items-center justify-end" style={{ gap: DashboardSpacing.sm }}>
                  <button
                    onClick={() => {
                      setIsEditingBio(false);
                      // Revert to original bio on cancel
                      setBioText(userProfile?.bio || '');
                    }}
                    className="px-3 py-1 hover:opacity-80 transition-opacity"
                    style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontSize: '12px',
                      color: DashboardColors.text.secondary,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    className="px-3 py-1 hover:opacity-90 transition-opacity"
                    style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontSize: '12px',
                      fontWeight: DashboardTypography.fontWeight.medium,
                      color: '#111111',
                      backgroundColor: '#ffffff',
                      borderRadius: DashboardRadius.sm,
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsEditingBio(true);
                  setTimeout(() => bioTextareaRef.current?.focus(), 0);
                }}
                className="group flex items-center justify-center hover:opacity-80 transition-opacity w-full"
                style={{ gap: DashboardSpacing.xs }}
              >
                {bioText ? (
                  <p style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontWeight: DashboardTypography.size.small.fontWeight,
                    fontSize: DashboardTypography.size.small.fontSize,
                    lineHeight: DashboardTypography.size.small.lineHeight,
                    letterSpacing: DashboardTypography.size.small.letterSpacing,
                    color: 'rgba(255, 255, 255, 0.44)',
                    textAlign: 'center',
                  }}>
                    {bioText}
                  </p>
                ) : (
                  <div className="flex items-center" style={{ gap: DashboardSpacing.xs }}>
                    <Pencil size={14} style={{ color: 'rgba(255, 255, 255, 0.44)' }} />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.small.fontWeight,
                      fontSize: DashboardTypography.size.small.fontSize,
                      lineHeight: DashboardTypography.size.small.lineHeight,
                      letterSpacing: DashboardTypography.size.small.letterSpacing,
                      color: 'rgba(255, 255, 255, 0.44)',
                      fontStyle: 'italic',
                    }}>
                      Click here to add your bio
                    </p>
                  </div>
                )}
                {bioText && (
                  <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255, 255, 255, 0.44)' }} />
                )}
              </button>
            )}
          </div>

          {/* Wallet + Social Links */}
          <div className="flex items-start justify-between w-full">
            {/* Wallet Button */}
            <button 
              onClick={handleCopyWallet}
              className="flex items-center border border-solid px-3 py-2 hover:opacity-80 transition-opacity"
              style={{ 
                gap: DashboardSpacing.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.16)',
                borderRadius: DashboardRadius.sm,
              }}
            >
              <div className="w-4 h-4">
                <img src={DashboardAssets.icons.wallet} alt="Wallet" className="w-full h-full object-contain" />
              </div>
              <p style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontWeight: DashboardTypography.fontWeight.medium,
                fontSize: '14px',
                lineHeight: '20px',
                color: DashboardColors.text.primary,
              }}>{shortWallet}</p>
              <div className="w-4 h-4">
                <img src={DashboardAssets.icons.copyArrow} alt="Copy" className="w-full h-full object-contain" />
              </div>
            </button>

            {/* Social Icons */}
            <div className="flex items-center" style={{ gap: DashboardSpacing.sm }}>
              {/* X/Twitter */}
              <button 
                className="flex items-center justify-center border border-solid hover:opacity-80 transition-opacity"
                style={{ 
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: DashboardRadius.sm,
                }}
              >
                <div className="w-5 h-5">
                  <img src={DashboardAssets.icons.xTwitter} alt="X" className="w-full h-full object-contain" />
            </div>
              </button>
              
              {/* Telegram */}
              <button 
                className="flex items-center justify-center border border-solid hover:opacity-80 transition-opacity"
                style={{ 
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: DashboardRadius.sm,
                }}
              >
                <div className="w-5 h-5">
                  <img src={DashboardAssets.icons.telegram} alt="Telegram" className="w-full h-full object-contain" />
                </div>
              </button>
            </div>
          </div>

          {/* Cultures */}
          <div className="flex flex-col relative" style={{ gap: DashboardSpacing.sm }} ref={dropdownRef}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.captionMedium.fontWeight,
              fontSize: DashboardTypography.size.captionMedium.fontSize,
              lineHeight: DashboardTypography.size.captionMedium.lineHeight,
              color: DashboardColors.text.tertiary,
            }}>Cultures</p>
            <div className="flex flex-wrap" style={{ gap: DashboardSpacing.sm }}>
              {selectedCultures.map((culture, idx) => {
                const icon = getCultureIcon(culture);
                const displayName = getCultureDisplayName(culture);
                return (
                  <div 
                    key={idx} 
                    className="flex items-center border border-solid group hover:border-red-500/50 transition-colors"
                    style={{
                      gap: DashboardSpacing.xs,
                      height: '36px',
                      padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
                      borderColor: DashboardColors.border.secondary,
                      borderRadius: DashboardRadius.pill,
                    }}
                  >
                    <img src={icon} alt={displayName} className="w-4 h-4 object-contain" />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.caption.fontWeight,
                      fontSize: DashboardTypography.size.caption.fontSize,
                      lineHeight: DashboardTypography.size.caption.lineHeight,
                      letterSpacing: DashboardTypography.size.caption.letterSpacing,
                      color: DashboardColors.text.primary,
                    }}>{displayName}</p>
                    <button
                      onClick={() => handleRemoveCulture(culture)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                      style={{ color: DashboardColors.text.secondary }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              
              {/* Add Culture Button */}
              <button
                onClick={() => setShowCultureDropdown(!showCultureDropdown)}
                className="flex items-center justify-center border border-dashed hover:border-solid hover:bg-white/5 transition-all"
                style={{
                  width: '36px',
                  height: '36px',
                  borderColor: DashboardColors.border.secondary,
                  borderRadius: DashboardRadius.pill,
                }}
              >
                <Plus size={16} style={{ color: DashboardColors.text.secondary }} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {showCultureDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 w-full border border-solid z-50 scrollbar-hide"
                style={{
                  backgroundColor: 'rgba(18, 18, 18, 0.98)',
                  backdropFilter: `blur(${DashboardBlur.medium})`,
                  WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: DashboardRadius.lg,
                  maxHeight: '320px',
                  overflowY: 'auto',
                  boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.8)',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                }}
              >
                {/* Header */}
                <div 
                  className="sticky top-0 flex items-center border-b border-solid"
                  style={{
                    padding: `${DashboardSpacing.md} ${DashboardSpacing.lg}`,
                    backgroundColor: 'rgba(18, 18, 18, 0.98)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <p style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontWeight: DashboardTypography.fontWeight.medium,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: DashboardColors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>Select Cultures</p>
                </div>

                {/* Culture List */}
                <div className="py-1">
                  {availableCultures.length > 0 ? (
                    availableCultures.map((culture) => {
                      const icon = getCultureIcon(culture);
                      const displayName = getCultureDisplayName(culture);
                      return (
                        <button
                          key={culture}
                          onClick={() => handleAddCulture(culture)}
                          className="w-full flex items-center hover:bg-white/10 active:bg-white/15 transition-colors"
                          style={{
                            gap: DashboardSpacing.md,
                            padding: `${DashboardSpacing.md} ${DashboardSpacing.lg}`,
                          }}
                        >
                          <img src={icon} alt={displayName} className="w-6 h-6 object-contain flex-shrink-0" />
                          <p style={{
                            fontFamily: DashboardTypography.fontFamily.primary,
                            fontWeight: DashboardTypography.fontWeight.medium,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: DashboardColors.text.primary,
                            textAlign: 'left',
                          }}>{displayName}</p>
                        </button>
                      );
                    })
                  ) : (
                    <div 
                      className="flex items-center justify-center"
                      style={{ padding: `${DashboardSpacing.xl} ${DashboardSpacing.lg}` }}
                    >
                      <p style={{
                        fontFamily: DashboardTypography.fontFamily.primary,
                        fontSize: '14px',
                        color: DashboardColors.text.secondary,
                        fontStyle: 'italic',
                      }}>All cultures selected</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats: $Zo + Vibe Score */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col" style={{ gap: DashboardSpacing.xs }}>
              <p style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontWeight: DashboardTypography.size.captionMedium.fontWeight,
                fontSize: DashboardTypography.size.captionMedium.fontSize,
                lineHeight: DashboardTypography.size.captionMedium.lineHeight,
                color: DashboardColors.text.tertiary,
              }}>$Zo</p>
              <div className="flex items-end" style={{ gap: DashboardSpacing.xs }}>
                <p style={{
                  fontFamily: DashboardTypography.fontFamily.primary,
                  fontWeight: DashboardTypography.fontWeight.medium,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: DashboardColors.text.primary,
                }}>{formatBalance(balance)}</p>
                {/* Coin with 3 gradient overlays */}
                <div 
                  className="relative"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: DashboardRadius.circle,
                    overflow: 'hidden',
                  }}
                >
                  <img 
                    src={DashboardAssets.statIcons.coin1}
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <img 
                    src={DashboardAssets.statIcons.coin2}
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <img 
                    src={DashboardAssets.statIcons.coin3}
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end" style={{ gap: DashboardSpacing.xs }}>
              <p style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontWeight: DashboardTypography.size.captionMedium.fontWeight,
                fontSize: DashboardTypography.size.captionMedium.fontSize,
                lineHeight: DashboardTypography.size.captionMedium.lineHeight,
                color: DashboardColors.text.tertiary,
                textAlign: 'right',
              }}>Vibe Score</p>
              <div className="flex items-end" style={{ gap: DashboardSpacing.sm }}>
                <p style={{
                  fontFamily: DashboardTypography.fontFamily.primary,
                  fontWeight: DashboardTypography.fontWeight.medium,
                  fontSize: '24px',
                  lineHeight: '32px',
                  color: DashboardColors.text.primary,
                  textAlign: 'right',
                }}>{vibeScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Connection Button */}
        <button 
          className="flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{
            gap: DashboardSpacing.xs,
            height: '32px',
            padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
            backgroundColor: '#ffffff',
            borderRadius: DashboardRadius.pill,
          }}
        >
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.caption.fontWeight,
            fontSize: DashboardTypography.size.caption.fontSize,
            letterSpacing: DashboardTypography.size.caption.letterSpacing,
            color: '#111111',
            lineHeight: 'normal',
          }}>Request Connection</p>
        </button>
      </div>

      {/* Founder NFTs */}
      <div 
        className="flex flex-col border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: DashboardColors.background.primary,
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          gap: DashboardSpacing.xl,
        }}
      >
        <p style={{
          fontFamily: DashboardTypography.fontFamily.primary,
          fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
          fontSize: DashboardTypography.size.bodyMedium.fontSize,
          lineHeight: '16px',
          letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
          color: DashboardColors.text.tertiary,
          textTransform: 'uppercase',
        }}>FOUNDER NFTs</p>
        
        <div className="flex flex-col" style={{ gap: DashboardSpacing.md }}>
          {/* NFT 1 */}
          <div className="flex items-center" style={{ gap: DashboardSpacing.md }}>
            <div 
              className="overflow-hidden"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: DashboardRadius.md,
                flexShrink: 0,
              }}
            >
              <img 
                src="/dashboard-assets/430-1.png" 
                alt="NFT #411" 
                className="w-full h-full object-cover"
              />
            </div>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.small.fontWeight,
              fontSize: DashboardTypography.size.small.fontSize,
              lineHeight: DashboardTypography.size.small.lineHeight,
              letterSpacing: DashboardTypography.size.small.letterSpacing,
              color: DashboardColors.text.primary,
            }}>#411</p>
          </div>

          {/* NFT 2 */}
          <div className="flex items-center" style={{ gap: DashboardSpacing.md }}>
            <div 
              className="overflow-hidden"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: DashboardRadius.md,
                flexShrink: 0,
              }}
            >
              <img 
                src="/dashboard-assets/430-2.png" 
                alt="NFT #831" 
                className="w-full h-full object-cover"
              />
            </div>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.small.fontWeight,
              fontSize: DashboardTypography.size.small.fontSize,
              lineHeight: DashboardTypography.size.small.lineHeight,
              letterSpacing: DashboardTypography.size.small.letterSpacing,
              color: DashboardColors.text.primary,
            }}>#831</p>
          </div>

          {/* NFT 3 */}
          <div className="flex items-center" style={{ gap: DashboardSpacing.md }}>
            <div 
              className="overflow-hidden"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: DashboardRadius.md,
                flexShrink: 0,
              }}
            >
              <img 
                src="/dashboard-assets/430-3.png" 
                alt="NFT #420" 
                className="w-full h-full object-cover"
              />
            </div>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.small.fontWeight,
              fontSize: DashboardTypography.size.small.fontSize,
              lineHeight: DashboardTypography.size.small.lineHeight,
              letterSpacing: DashboardTypography.size.small.letterSpacing,
              color: DashboardColors.text.primary,
            }}>#420</p>
          </div>
        </div>
      </div>

      {/* Zo Mafia Card */}
      <Link
        href="https://zo.xyz/@mafia"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col border border-solid overflow-hidden transition-all hover:opacity-90 cursor-pointer"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: DashboardColors.background.primary,
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
        }}
      >
        <img 
          src="/zomafia.png" 
          alt="Zo Mafia" 
          className="w-full h-auto object-cover"
        />
      </Link>
    </div>
    </>
  );
};

export default LeftSidebar;

