'use client';

import React, { useMemo, useState } from 'react';
import { PrivyUserProfile } from '@/types/user';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';
import { devLog } from '@/lib/logger';
import MyEventsCard from './MyEventsCard';
import { HostEventModal } from '@/components/events';
import { getEventCoverImage } from '@/lib/eventCoverDefaults';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface RightSidebarProps {
  userProfile: PrivyUserProfile | null;
  events?: EventData[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ userProfile, events: rawEvents = [] }) => {
  const [showHostModal, setShowHostModal] = useState(false);

  // Convert EventData to dashboard format
  const events = useMemo(() => {
    devLog.log('🎫 RightSidebar received events:', rawEvents.length);
    
    // Log sample event structure for debugging
    if (rawEvents.length > 0) {
      devLog.log('📋 Sample event structure:', {
        'Event Name': rawEvents[0]['Event Name'],
        'Date & Time': rawEvents[0]['Date & Time'],
        'Location': rawEvents[0].Location,
        'Latitude': rawEvents[0].Latitude,
        'Longitude': rawEvents[0].Longitude,
        'Event URL': rawEvents[0]['Event URL'],
        fullEvent: rawEvents[0], // Show complete event object
      });
    }
    
    const upcoming = rawEvents.filter(event => {
      // Only show upcoming events
      const eventDate = new Date(event['Date & Time']);
      return eventDate > new Date();
    });
    devLog.log('🎫 Upcoming events:', upcoming.length);
    
    return upcoming
      .map((event, index) => {
        const eventAny = event as any;
        const coverUrl = getEventCoverImage({
          coverImageUrl: eventAny._cover_image_url,
          culture: eventAny._culture,
          category: eventAny._category,
        });
        return {
          id: eventAny._id || `${event['Event Name']}-${event['Date & Time']}-${index}`, // Use event ID if available
          title: event['Event Name'],
          start_time: event['Date & Time'],
          location: event.Location,
          image_url: coverUrl, // Always has a value with default fallback
          is_free: true, // Default to free
          category: eventAny._category || 'event',
          culture: eventAny._culture,
        };
      })
      .slice(0, 10); // Limit to 10 events
  }, [rawEvents]);
  
  // Format time difference for event start time
  const getTimeUntil = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) {
      return 'Ongoing';
    } else if (hours < 1) {
      return 'Starting soon';
    } else if (hours < 24) {
      return `Starts in ${hours} hrs`;
    } else {
      const days = Math.floor(hours / 24);
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  // Extract city from location
  const extractCity = (location?: string) => {
    if (!location) return 'TBA';
    // Try to extract city from location string (e.g., "123 Street, San Francisco, CA" -> "San Francisco, CA")
    const parts = location.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return location;
  };
  return (
    <div className="flex flex-col w-[360px] flex-shrink-0" style={{ gap: DashboardSpacing.xl }}>
      {/* My Events - User's hosted events */}
      <MyEventsCard 
        userId={userProfile?.id} 
        onHostEvent={() => setShowHostModal(true)} 
      />

      {/* Host Event Modal */}
      <HostEventModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        userId={userProfile?.id}
        onSuccess={() => {
          setShowHostModal(false);
          // TODO: Refresh my events list
        }}
      />

      {/* Local Events */}
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
        }}>LOCAL EVENTS</p>
        
        {/* Scrollable Events Container */}
        <div 
          className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
          style={{
            gap: DashboardSpacing.md,
            maxHeight: 'calc(3 * 180px + 2 * 16px)', // Show exactly 3 events (180px each with cover + 16px gap)
            paddingRight: '4px',
          }}
        >
          {events.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center border border-solid"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderColor: DashboardColors.border.primary,
                borderRadius: DashboardRadius.md,
                padding: DashboardSpacing.xl,
              }}
            >
              <p style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontSize: DashboardTypography.size.small.fontSize,
                color: DashboardColors.text.secondary,
                textAlign: 'center',
              }}>No upcoming events found nearby</p>
                  </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id}
                className="flex flex-col border border-solid overflow-hidden"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderColor: DashboardColors.border.primary,
                  borderRadius: DashboardRadius.md,
                  minHeight: '180px', // Fixed height with cover image
                  flexShrink: 0,
                }}
              >
                {/* Cover Image - always shown with default fallback */}
                <div className="w-full h-20 overflow-hidden flex-shrink-0">
                  <img 
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: DashboardSpacing.lg, gap: DashboardSpacing.md }} className="flex flex-col flex-1">
                  {/* Title */}
                  <p style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
                    fontSize: DashboardTypography.size.bodyMedium.fontSize,
                    lineHeight: '24px',
                    letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
                    color: DashboardColors.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{event.title}</p>
                  
                  {/* Time */}
                  <p style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontWeight: DashboardTypography.size.small.fontWeight,
                    fontSize: DashboardTypography.size.small.fontSize,
                    lineHeight: DashboardTypography.size.small.lineHeight,
                    letterSpacing: DashboardTypography.size.small.letterSpacing,
                    color: DashboardColors.text.secondary,
                  }}>{getTimeUntil(event.start_time)}</p>
                  
                  {/* Bottom Row: Location, Free/Paid, View - All aligned on same line */}
                  <div className="flex items-center justify-between mt-auto" style={{ gap: DashboardSpacing.md }}>
                    <div className="flex items-center flex-1" style={{ gap: DashboardSpacing.sm, minWidth: 0 }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>📍</span>
                      <p style={{
                        fontFamily: DashboardTypography.fontFamily.primary,
                        fontWeight: DashboardTypography.size.small.fontWeight,
                        fontSize: DashboardTypography.size.small.fontSize,
                        lineHeight: DashboardTypography.size.small.lineHeight,
                        letterSpacing: DashboardTypography.size.small.letterSpacing,
                        color: DashboardColors.text.secondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{extractCity(event.location)}</p>
                  </div>
                  
                    {/* Free/Paid and View button aligned on right */}
                    <div className="flex items-center" style={{ gap: DashboardSpacing.md, flexShrink: 0 }}>
                      <p style={{
                        fontFamily: DashboardTypography.fontFamily.primary,
                        fontWeight: DashboardTypography.size.small.fontWeight,
                        fontSize: DashboardTypography.size.small.fontSize,
                        lineHeight: DashboardTypography.size.small.lineHeight,
                        letterSpacing: DashboardTypography.size.small.letterSpacing,
                        color: DashboardColors.text.secondary,
                      }}>{event.is_free ? 'Free' : 'Paid'}</p>
                      <button 
                        className="border border-solid hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: '#000000',
                          borderColor: DashboardColors.border.primary,
                          borderRadius: DashboardRadius.pill,
                          padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
                          height: '32px',
                        }}
                      >
                        <p style={{
                          fontFamily: DashboardTypography.fontFamily.primary,
                          fontWeight: DashboardTypography.size.caption.fontWeight,
                          fontSize: DashboardTypography.size.caption.fontSize,
                          letterSpacing: DashboardTypography.size.caption.letterSpacing,
                          color: DashboardColors.text.primary,
                        }}>View</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
      </div>

      {/* ZO CARD Application */}
      <div 
        className="flex items-start justify-between border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: '#000000',
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          height: '160px',
        }}
      >
        <div className="flex-1 flex flex-col h-full items-start justify-between">
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.caption.fontWeight,
            fontSize: DashboardTypography.size.caption.fontSize,
            lineHeight: '16px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
          }}>Apply for</p>
          <div className="flex flex-col" style={{ gap: DashboardSpacing.sm }}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.display,
              fontWeight: DashboardTypography.fontWeight.extraBold,
              fontSize: DashboardTypography.size.display.fontSize,
              lineHeight: DashboardTypography.size.display.lineHeight,
              letterSpacing: DashboardTypography.size.display.letterSpacing,
              color: DashboardColors.text.primary,
              marginBottom: '-8px',
            }}>ZO</p>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.display,
              fontWeight: DashboardTypography.fontWeight.extraBold,
              fontSize: DashboardTypography.size.display.fontSize,
              lineHeight: DashboardTypography.size.display.lineHeight,
              letterSpacing: DashboardTypography.size.display.letterSpacing,
              color: DashboardColors.text.primary,
            }}>CARD</p>
          </div>
        </div>
        <div 
          className="overflow-hidden"
          style={{
            width: '112px',
            height: '112px',
            borderRadius: DashboardRadius.md,
          }}
        >
          <img 
            src="/dashboard-assets/rectangle-752.png" 
            alt="ZO CARD" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;

