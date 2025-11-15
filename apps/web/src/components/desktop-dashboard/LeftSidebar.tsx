'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { getCultureDisplayName, getCultureIcon } from '@/lib/cultures';
import { PrivyUserProfile } from '@/types/privy';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur, DashboardAssets } from '@/styles/dashboard-tokens';

interface LeftSidebarProps {
  userProfile: PrivyUserProfile | null;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userProfile }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopyWallet = () => {
    if (userProfile?.wallets?.[0]?.address) {
      navigator.clipboard.writeText(userProfile.wallets[0].address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const cultures = userProfile?.culture?.split(',').map(c => c.trim()).filter(Boolean) || [];
  const primaryWallet = userProfile?.wallets?.[0]?.address;
  const shortWallet = primaryWallet ? `0x...${primaryWallet?.slice(-4)}` : '';

  return (
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
        <div className="flex items-center justify-between w-full">
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
            }}>Founder</p>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.fontWeight.medium,
              fontSize: DashboardTypography.size.smallMedium.fontSize,
              lineHeight: DashboardTypography.size.smallMedium.lineHeight,
              color: DashboardColors.text.primary,
            }}>#1413</p>
          </div>
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

        {/* Profile Photo with Animated GIF Frame */}
        <div className="flex flex-col items-center justify-center w-[312px]" style={{ gap: DashboardSpacing.sm }}>
          <div 
            className="relative"
            style={{
              width: '355px',
              height: '355px',
            }}
          >
            {/* Animated GIF Frame (transparent) */}
            <img 
              src="/Profileacrd.gif"
              alt="Profile Frame" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            
            {/* Profile Photo - Absolutely positioned inside frame */}
            <div
              className="absolute overflow-hidden"
              style={{
                width: '181px',
                height: '175px',
                left: 'calc(50% + 0.5px)',
                top: '61px',
                transform: 'translateX(-50%)',
                borderRadius: '8px',
                backgroundColor: 'transparent',
              }}
            >
            <img 
                src={userProfile?.pfp || DashboardAssets.profile.photo}
              alt="Profile" 
                className="w-full h-full"
                style={{
                  objectFit: 'contain',
                  backgroundColor: 'transparent',
                }}
            />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col w-full" style={{ gap: DashboardSpacing.xl }}>
          {/* Name + Verified Badge */}
          <div className="flex items-center justify-center" style={{ gap: DashboardSpacing.md }}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.fontWeight.medium,
              fontSize: '32px',
              lineHeight: '44px',
              color: DashboardColors.text.primary,
              textAlign: 'center',
            }}>
              {userProfile?.name || 'Anonymous'}
            </p>
            {/* Verified Badge */}
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img 
                src={DashboardAssets.profile.badge}
                alt="Verified" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="flex items-center justify-center" style={{ gap: DashboardSpacing.sm }}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.small.fontWeight,
              fontSize: DashboardTypography.size.small.fontSize,
              lineHeight: DashboardTypography.size.small.lineHeight,
              letterSpacing: DashboardTypography.size.small.letterSpacing,
              color: 'rgba(255, 255, 255, 0.44)',
              textAlign: 'center',
            }}>
              {userProfile?.bio || 'Deep understanding of Web3 and product development to create seamless, gamified platforms that empower decentralized communities.'}
            </p>
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
          <div className="flex flex-col" style={{ gap: DashboardSpacing.sm }}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontWeight: DashboardTypography.size.captionMedium.fontWeight,
              fontSize: DashboardTypography.size.captionMedium.fontSize,
              lineHeight: DashboardTypography.size.captionMedium.lineHeight,
              color: DashboardColors.text.tertiary,
            }}>Cultures</p>
            <div className="flex flex-wrap" style={{ gap: DashboardSpacing.sm }}>
              {cultures.length > 0 ? cultures.map((culture, idx) => {
                const icon = getCultureIcon(culture);
                const displayName = getCultureDisplayName(culture);
                return (
                  <div 
                    key={idx} 
                    className="flex items-center border border-solid"
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
                  </div>
                );
              }) : (
                <>
                  <div 
                    className="flex items-center border border-solid"
                    style={{
                      gap: DashboardSpacing.xs,
                      height: '36px',
                      padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
                      borderColor: DashboardColors.border.secondary,
                      borderRadius: DashboardRadius.pill,
                    }}
                  >
                    <img src={DashboardAssets.culture.food} alt="Food" className="w-4 h-4 object-contain" />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.caption.fontWeight,
                      fontSize: DashboardTypography.size.caption.fontSize,
                      lineHeight: DashboardTypography.size.caption.lineHeight,
                      letterSpacing: DashboardTypography.size.caption.letterSpacing,
                      color: DashboardColors.text.primary,
                    }}>Food</p>
                  </div>
                  <div 
                    className="flex items-center border border-solid"
                    style={{
                      gap: DashboardSpacing.xs,
                      height: '36px',
                      padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
                      borderColor: DashboardColors.border.secondary,
                      borderRadius: DashboardRadius.pill,
                    }}
                  >
                    <img src={DashboardAssets.culture.tech} alt="Tech" className="w-4 h-4 object-contain" />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.caption.fontWeight,
                      fontSize: DashboardTypography.size.caption.fontSize,
                      lineHeight: DashboardTypography.size.caption.lineHeight,
                      letterSpacing: DashboardTypography.size.caption.letterSpacing,
                      color: DashboardColors.text.primary,
                    }}>Tech</p>
                  </div>
                  <div 
                    className="flex items-center border border-solid"
                    style={{
                      gap: DashboardSpacing.xs,
                      height: '36px',
                      padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
                      borderColor: DashboardColors.border.secondary,
                      borderRadius: DashboardRadius.pill,
                    }}
                  >
                    <img src={DashboardAssets.culture.design} alt="Design" className="w-4 h-4 object-contain" />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.caption.fontWeight,
                      fontSize: DashboardTypography.size.caption.fontSize,
                      lineHeight: DashboardTypography.size.caption.lineHeight,
                      letterSpacing: DashboardTypography.size.caption.letterSpacing,
                      color: DashboardColors.text.primary,
                    }}>Design</p>
                  </div>
                </>
              )}
            </div>
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
                }}>11.11K</p>
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
                }}>99</p>
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

      {/* Offer Section */}
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
        <div className="flex flex-col" style={{ gap: DashboardSpacing.sm }}>
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
            fontSize: DashboardTypography.size.bodyMedium.fontSize,
            lineHeight: '32px',
            letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
            color: DashboardColors.text.primary,
          }}>I would like to offer</p>
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.small.fontWeight,
            fontSize: DashboardTypography.size.small.fontSize,
            lineHeight: DashboardTypography.size.small.lineHeight,
            letterSpacing: DashboardTypography.size.small.letterSpacing,
            color: DashboardColors.text.secondary,
          }}>
            {userProfile?.bio || 'Deep understanding of Web3 and product development to create seamless, gamified platforms that empower decentralized communities.'}
          </p>
        </div>
      </div>

      {/* Help Section */}
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
        <div className="flex flex-col" style={{ gap: DashboardSpacing.sm }}>
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
            fontSize: DashboardTypography.size.bodyMedium.fontSize,
            lineHeight: '32px',
            letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
            color: DashboardColors.text.primary,
          }}>I would like to get help in</p>
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.small.fontWeight,
            fontSize: DashboardTypography.size.small.fontSize,
            lineHeight: DashboardTypography.size.small.lineHeight,
            letterSpacing: DashboardTypography.size.small.letterSpacing,
            color: DashboardColors.text.secondary,
          }}>
            {'Branding and product design to refine Wall.app\'s identity and user experience. Expertise in crafting cohesive narratives and user-centric designs to stand out and drive adoption.'}
          </p>
        </div>
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
    </div>
  );
};

export default LeftSidebar;

