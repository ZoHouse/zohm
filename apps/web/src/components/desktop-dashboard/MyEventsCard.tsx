'use client';

/**
 * MyEventsCard Component
 * 
 * Shows community events hosted by the current user in the dashboard.
 * Fetches from /api/events/mine endpoint.
 * Supports editing events via EditEventModal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, MapPin, Users, ExternalLink, Pencil, ChevronRight } from 'lucide-react';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';
import { devLog } from '@/lib/logger';
import { EditEventModal } from '@/components/events/EditEventModal';
import { getCultureAssetUrl, EventCulture } from '@/types/events';
import { getEventCoverImage } from '@/lib/eventCoverDefaults';

interface MyEvent {
  id: string;
  title: string;
  description?: string;
  culture: string;
  starts_at: string;
  ends_at: string;
  location_name: string;
  location_raw?: string;
  lat?: number;
  lng?: number;
  submission_status: string; // draft, pending, approved, rejected, cancelled
  max_capacity?: number;
  cover_image_url?: string;
}

interface MyEventsCardProps {
  userId?: string;
  onHostEvent?: () => void;
}

const MyEventsCard: React.FC<MyEventsCardProps> = ({ userId, onHostEvent }) => {
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);

  const fetchMyEvents = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/events/mine', {
        headers: {
          'x-user-id': userId || '',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await res.json();
      // API returns { hosted: [], rsvps: [], past: [], stats: {} }
      // Filter out cancelled events for the dashboard card (they show on the full page)
      const activeEvents = (data.hosted || []).filter(
        (e: MyEvent) => e.submission_status !== 'cancelled'
      );
      setEvents(activeEvents);
      setError(null);
    } catch (err) {
      devLog.error('Failed to fetch my events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  // Format date for display
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get status color based on submission_status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'draft': return '#FFC107';
      case 'rejected': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      default: return DashboardColors.text.secondary;
    }
  };

  // Get culture asset file name for sticker image
  const getCultureAssetFile = (culture: string) => {
    const cultureAssets: Record<string, string> = {
      'science_technology': 'Science&Technology.png',
      'business': 'Business.png',
      'design': 'Design.png',
      'food': 'Food.png',
      'game': 'Game.png',
      'health_fitness': 'Health&Fitness.png',
      'home_lifestyle': 'Home&Lifestyle.png',
      'music_entertainment': 'Music&Entertainment.png',
      'nature_wildlife': 'Nature&Wildlife.png',
      'photography': 'Photography.png',
      'spiritual': 'Spiritual.png',
      'travel_adventure': 'Travel&Adventure.png',
      'television_cinema': 'Television&Cinema.png',
      'sport': 'Sport.png',
      'literature_stories': 'Literature&Stories.png',
      'follow_your_heart': 'FollowYourHeart.png',
      'law': 'Law.png',
      'stories_journal': 'Stories&Journal.png',
    };
    return cultureAssets[culture] || 'FollowYourHeart.png';
  };

  return (
    <div 
      className="flex flex-col border border-solid"
      style={{
        backdropFilter: `blur(${DashboardBlur.medium})`,
        WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
        backgroundColor: DashboardColors.background.primary,
        borderColor: DashboardColors.border.primary,
        borderRadius: DashboardRadius.lg,
        padding: DashboardSpacing.xl,
        gap: DashboardSpacing.lg,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p style={{
          fontFamily: DashboardTypography.fontFamily.primary,
          fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
          fontSize: DashboardTypography.size.bodyMedium.fontSize,
          lineHeight: '16px',
          letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
          color: DashboardColors.text.tertiary,
          textTransform: 'uppercase',
        }}>MY EVENTS</p>
        <button
          onClick={() => router.push('/my-events')}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#ff4d6d]"
          style={{ color: DashboardColors.text.secondary }}
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: DashboardRadius.md,
                height: '80px',
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div 
          className="flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: DashboardRadius.md,
            padding: DashboardSpacing.lg,
          }}
        >
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontSize: DashboardTypography.size.small.fontSize,
            color: DashboardColors.text.secondary,
          }}>{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center border border-dashed"
          style={{
            borderColor: DashboardColors.border.primary,
            borderRadius: DashboardRadius.md,
            padding: DashboardSpacing.xl,
            gap: DashboardSpacing.md,
          }}
        >
          <Calendar size={32} color={DashboardColors.text.tertiary} />
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontSize: DashboardTypography.size.small.fontSize,
            color: DashboardColors.text.secondary,
            textAlign: 'center',
          }}>You haven&apos;t hosted any events yet</p>
          {onHostEvent && (
            <button
              onClick={onHostEvent}
              className="flex items-center gap-2 border border-solid hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'transparent',
                borderColor: '#ff4d6d',
                borderRadius: DashboardRadius.pill,
                padding: `${DashboardSpacing.sm} ${DashboardSpacing.lg}`,
              }}
            >
              <Plus size={16} color="#ff4d6d" />
              <span style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontSize: DashboardTypography.size.small.fontSize,
                color: '#ff4d6d',
              }}>Host your first event</span>
            </button>
          )}
        </div>
      ) : (
        <div 
          className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          style={{
            gap: DashboardSpacing.md,
            maxHeight: 'calc(2 * 90px + 12px)', // Show 2 events max
            paddingRight: '4px',
          }}
        >
          {events.slice(0, 5).map((event) => {
            const coverUrl = getEventCoverImage({
              coverImageUrl: event.cover_image_url,
              culture: event.culture as EventCulture,
              category: 'community',
            });
            
            return (
              <div
                key={event.id}
                className="group flex flex-col border border-solid hover:border-white/30 transition-colors overflow-hidden"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderColor: DashboardColors.border.primary,
                  borderRadius: DashboardRadius.md,
                  minHeight: '90px',
                  flexShrink: 0,
                }}
              >
                {/* Cover Image - always show with default fallback */}
                <div className="w-full h-16 overflow-hidden">
                  <img 
                    src={coverUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: DashboardSpacing.md, gap: DashboardSpacing.sm }} className="flex flex-col">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img 
                      src={getCultureAssetUrl(getCultureAssetFile(event.culture))}
                      alt={event.culture}
                      className="w-6 h-6 object-contain"
                      loading="lazy"
                    />
                    <p style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
                      fontSize: '13px',
                      lineHeight: '18px',
                      color: DashboardColors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{event.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit Button - visible on hover */}
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white/10 hover:bg-white/20"
                      title="Edit event"
                    >
                      <Pencil size={12} color={DashboardColors.text.secondary} />
                    </button>
                    <span 
                      className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `${getStatusColor(event.submission_status)}20`,
                        color: getStatusColor(event.submission_status),
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {event.submission_status === 'approved' ? 'Live' : event.submission_status}
                    </span>
                  </div>
                </div>

              {/* Details Row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar size={12} color={DashboardColors.text.tertiary} />
                  <span style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontSize: '11px',
                    color: DashboardColors.text.secondary,
                  }}>{formatEventDate(event.starts_at)}</span>
                </div>
                
                {event.location_name && (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <MapPin size={12} color={DashboardColors.text.tertiary} />
                    <span style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontSize: '11px',
                      color: DashboardColors.text.secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{event.location_name}</span>
                  </div>
                )}

                {event.max_capacity && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Users size={12} color={DashboardColors.text.tertiary} />
                    <span style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontSize: '11px',
                      color: DashboardColors.text.secondary,
                    }}>
                      {event.max_capacity} max
                    </span>
                  </div>
                )}
              </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {events.length > 2 && (
        <button
          className="flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
          style={{ padding: DashboardSpacing.sm }}
        >
          <span style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontSize: DashboardTypography.size.small.fontSize,
            color: '#ff4d6d',
          }}>View all {events.length} events</span>
          <ExternalLink size={12} color="#ff4d6d" />
        </button>
      )}

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        userId={userId}
        onSuccess={() => {
          setEditingEvent(null);
          fetchMyEvents(); // Refresh the list
        }}
      />
    </div>
  );
};

export default MyEventsCard;
