'use client';

import React from 'react';
import { DashboardTypography } from '@/styles/dashboard-tokens';

interface ZoPassportComponentProps {
  profile?: {
    avatar?: string;
    name?: string;
    isFounder?: boolean;
  };
  completion?: {
    done: number;
    total: number;
  };
  className?: string;
}

const FOUNDER_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png";
const CITIZEN_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png";

const FounderBadge = () => (
  <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.0117 3.15234C13.1449 2.14828 14.8551 2.14828 15.9883 3.15234L16.0996 3.25684L17.7715 4.89453L20.1123 4.91895L20.2646 4.92383C21.7758 5.01516 22.9848 6.22423 23.0762 7.73535L23.0811 7.8877L23.1045 10.2275L24.7432 11.9004L24.8477 12.0117C25.8517 13.1449 25.8517 14.8551 24.8477 15.9883L24.7432 16.0996L23.1045 17.7715L23.0811 20.1123C23.0646 21.6938 21.8262 22.9818 20.2646 23.0762L20.1123 23.0811L17.7715 23.1045L16.0996 24.7432C14.9697 25.8498 13.1826 25.8852 12.0117 24.8477L11.9004 24.7432L10.2275 23.1045L7.8877 23.0811C6.30625 23.0646 5.01821 21.8262 4.92383 20.2646L4.91895 20.1123L4.89453 17.7715L3.25684 16.0996C2.11446 14.9333 2.11446 13.0667 3.25684 11.9004L4.89453 10.2275L4.91895 7.8877L4.92383 7.73535C5.01821 6.17382 6.30624 4.93536 7.8877 4.91895L10.2275 4.89453L11.9004 3.25684L12.0117 3.15234Z" fill="#FF2F8E" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
    <path d="M13.5008 16.1741H15.8997C16.4443 16.1741 16.8858 16.6156 16.8858 17.1602C16.8858 17.7048 16.4443 18.1463 15.8997 18.1463H12.2286C11.4558 18.1463 10.8293 17.5199 10.8293 16.7471C10.8293 16.4219 10.9425 16.1069 11.1495 15.8562L14.0743 12.3137H11.8434C11.2988 12.3137 10.8573 11.8722 10.8573 11.3276C10.8573 10.783 11.2988 10.3415 11.8434 10.3415H15.4226C16.1921 10.3415 16.8158 10.9652 16.8158 11.7347C16.8158 12.0634 16.6996 12.3816 16.4876 12.6329L13.5008 16.1741Z" fill="white" />
  </svg>
);

const CircularProgress = ({ size = 140, progress = 0, strokeWidth = 4, secondaryStroke = "rgba(255,255,255,0.2)", primaryStroke = "#FFFFFF" }: { size?: number, progress?: number, strokeWidth?: number, secondaryStroke?: string, primaryStroke?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        stroke={secondaryStroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={primaryStroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
      />
    </svg>
  );
};

const ZoPassportComponent: React.FC<ZoPassportComponentProps> = ({ profile, completion, className }) => {
  const isFounder = profile?.isFounder || false;
  const name = profile?.name || "New Citizen";
  const avatar = profile?.avatar || "/images/rank1.jpeg"; // Default fallback
  const done = completion?.done || 0;
  const total = completion?.total || 1;
  const progress = Math.min(100, Math.max(0, (done / total) * 100));

  const bgImage = isFounder ? FOUNDER_BG : CITIZEN_BG;
  const textColor = isFounder ? 'text-white' : 'text-[#111111]';
  const shadowStyle = isFounder
    ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
    : '0 20px 25px -5px rgba(241, 86, 63, 0.5), 0 8px 10px -6px rgba(241, 86, 63, 0.1)';

  return (
    <div
      className={`relative w-[234px] h-[300px] rounded-tr-[20px] rounded-br-[20px] overflow-hidden ${className || ''}`}
      style={{
        fontFamily: DashboardTypography.fontFamily.primary,
        boxShadow: shadowStyle,
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt="Zo Passport Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Circular Progress - Absolutely positioned in center */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-10px' }}>
        <CircularProgress
          size={140}
          progress={progress}
          primaryStroke={isFounder ? "#FFFFFF" : "#111111"}
          secondaryStroke={isFounder ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
        />
      </div>

      {/* Avatar - Absolutely positioned in center */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-10px' }}>
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Founder Badge */}
        {isFounder && (
          <div className="absolute" style={{ bottom: '84px', right: '60px' }}>
            <FounderBadge />
          </div>
        )}
      </div>

      {/* Text Container - Absolutely positioned at bottom */}
      <div
        className="absolute left-0 right-0 text-center flex flex-col gap-1"
        style={{
          bottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        <p
          className={`font-bold truncate ${textColor}`}
          style={{
            fontSize: '18px',
            lineHeight: '24px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {name}
        </p>
        <p
          className={`opacity-70 uppercase tracking-wider ${textColor}`}
          style={{
            fontSize: '10px',
            lineHeight: '14px',
            letterSpacing: '0.05em'
          }}
        >
          {isFounder ? "Founder of Zo World" : "Citizen of Zo World"}
        </p>
      </div>
    </div>
  );
};

export default ZoPassportComponent;

