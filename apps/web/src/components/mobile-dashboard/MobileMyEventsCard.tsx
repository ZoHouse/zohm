'use client';

/**
 * MobileMyEventsCard Component
 * 
 * Shows community events hosted by the user in mobile dashboard.
 * Includes edit functionality via EditEventModal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, MapPin, ChevronRight, Pencil } from 'lucide-react';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';
import { EditEventModal } from '@/components/events/EditEventModal';
import { HostEventModal } from '@/components/events/HostEventModal';
import { devLog } from '@/lib/logger';
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
  submission_status: string;
  max_capacity?: number;
  cover_image_url?: string;
}

interface MobileMyEventsCardProps {
  userId?: string;
}

const MobileMyEventsCard: React.FC<MobileMyEventsCardProps> = ({ userId }) => {
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/events/mine', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await res.json();
      // Filter out cancelled events for the dashboard card (they show on the full page)
      const activeEvents = (data.hosted || []).filter(
        (e: MyEvent) => e.submission_status !== 'cancelled'
      );
      setEvents(activeEvents);
    } catch (err) {
      devLog.error('Failed to fetch my events:', err);
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
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
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
    <div className="px-4 mt-6">
      <div 
        className="border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: DashboardColors.background.primary,
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.lg,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.fontWeight.medium,
            fontSize: '14px',
            color: DashboardColors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>My Events</p>
          <button
            onClick={() => router.push('/my-events')}
            className="flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: '#ff4d6d' }}
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  height: '72px',
                }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-6 border border-dashed rounded-xl"
            style={{ borderColor: DashboardColors.border.primary }}
          >
            <Calendar size={32} color={DashboardColors.text.tertiary} />
            <p style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontSize: '13px',
              color: DashboardColors.text.secondary,
              marginTop: '12px',
              textAlign: 'center',
            }}>No events yet</p>
            <button
              onClick={() => setShowHostModal(true)}
              className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full border transition-colors"
              style={{
                borderColor: '#ff4d6d',
                backgroundColor: 'transparent',
              }}
            >
              <Plus size={16} color="#ff4d6d" />
              <span style={{
                fontFamily: DashboardTypography.fontFamily.primary,
                fontSize: '13px',
                color: '#ff4d6d',
                fontWeight: 600,
              }}>Host an Event</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => {
              const coverUrl = getEventCoverImage({
                coverImageUrl: event.cover_image_url,
                culture: event.culture as EventCulture,
                category: 'community',
              });
              
              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-solid overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderColor: DashboardColors.border.primary,
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
                  <div className="flex items-center gap-3 p-3">
                  {/* Culture Sticker */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <img 
                      src={getCultureAssetUrl(getCultureAssetFile(event.culture))}
                      alt={event.culture}
                      className="w-8 h-8 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{
                        fontFamily: DashboardTypography.fontFamily.primary,
                        fontWeight: 600,
                        fontSize: '14px',
                        color: DashboardColors.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{event.title}</p>
                      <span 
                        className="flex-shrink-0 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${getStatusColor(event.submission_status)}20`,
                          color: getStatusColor(event.submission_status),
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {event.submission_status === 'approved' ? 'Live' : event.submission_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} color={DashboardColors.text.tertiary} />
                        <span style={{
                          fontFamily: DashboardTypography.fontFamily.primary,
                          fontSize: '11px',
                          color: DashboardColors.text.secondary,
                        }}>{formatEventDate(event.starts_at)}</span>
                      </div>
                      {event.location_name && (
                        <div className="flex items-center gap-1">
                          <MapPin size={11} color={DashboardColors.text.tertiary} />
                          <span style={{
                            fontFamily: DashboardTypography.fontFamily.primary,
                            fontSize: '11px',
                            color: DashboardColors.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100px',
                          }}>{event.location_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingEvent(event)}
                    className="flex-shrink-0 p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <Pencil size={16} color={DashboardColors.text.secondary} />
                  </button>
                </div>
              </div>
              );
            })}

            {/* View All / Host Button */}
            <div className="flex gap-2 mt-2">
              {events.length > 3 && (
                <button
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <span style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontSize: '12px',
                    color: '#ff4d6d',
                    fontWeight: 600,
                  }}>View all {events.length}</span>
                  <ChevronRight size={14} color="#ff4d6d" />
                </button>
              )}
              <button
                onClick={() => setShowHostModal(true)}
                className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255, 77, 109, 0.2)' }}
              >
                <Plus size={14} color="#ff4d6d" />
                <span style={{
                  fontFamily: DashboardTypography.fontFamily.primary,
                  fontSize: '12px',
                  color: '#ff4d6d',
                  fontWeight: 600,
                }}>Host</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        userId={userId}
        onSuccess={() => {
          setEditingEvent(null);
          fetchMyEvents();
        }}
      />

      {/* Host Event Modal */}
      <HostEventModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        userId={userId}
        onSuccess={() => {
          setShowHostModal(false);
          fetchMyEvents();
        }}
      />
    </div>
  );
};

export default MobileMyEventsCard;
