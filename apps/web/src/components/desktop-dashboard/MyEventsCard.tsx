'use client';

/**
 * MyEventsCard Component
 * 
 * Shows community events hosted by the current user in the dashboard.
 * Fetches from /api/events/mine endpoint.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';
import { devLog } from '@/lib/logger';

interface MyEvent {
  id: string;
  title: string;
  culture: string;
  starts_at: string;
  ends_at: string;
  location_name: string;
  submission_status: string; // draft, pending, published, rejected, cancelled
  max_capacity?: number;
}

interface MyEventsCardProps {
  userId?: string;
  onHostEvent?: () => void;
}

const MyEventsCard: React.FC<MyEventsCardProps> = ({ userId, onHostEvent }) => {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchMyEvents() {
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
        setEvents(data.hosted || []);
        setError(null);
      } catch (err) {
        devLog.error('Failed to fetch my events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    fetchMyEvents();
  }, [userId]);

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

  // Get culture emoji
  const getCultureEmoji = (culture: string) => {
    const cultureEmojis: Record<string, string> = {
      'science_technology': '🔬',
      'business': '💼',
      'design': '🎨',
      'food': '🍕',
      'game': '🎮',
      'health_fitness': '💪',
      'home_lifestyle': '🛋️',
      'music_entertainment': '🎸',
      'nature_wildlife': '🌻',
      'photography': '📸',
      'spiritual': '🧘',
      'travel_adventure': '✈️',
      'television_cinema': '🎬',
      'sport': '⚽',
      'literature_stories': '📚',
      'follow_your_heart': '❤️',
    };
    return cultureEmojis[culture] || '📅';
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
      <p style={{
        fontFamily: DashboardTypography.fontFamily.primary,
        fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
        fontSize: DashboardTypography.size.bodyMedium.fontSize,
        lineHeight: '16px',
        letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
        color: DashboardColors.text.tertiary,
        textTransform: 'uppercase',
      }}>MY EVENTS</p>

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
          {events.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex flex-col border border-solid hover:border-white/30 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderColor: DashboardColors.border.primary,
                borderRadius: DashboardRadius.md,
                padding: DashboardSpacing.md,
                gap: DashboardSpacing.sm,
                minHeight: '90px',
                flexShrink: 0,
              }}
            >
              {/* Title Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span style={{ fontSize: '16px' }}>{getCultureEmoji(event.culture)}</span>
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
                  {event.submission_status === 'published' ? 'Live' : event.submission_status}
                </span>
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
          ))}
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
    </div>
  );
};

export default MyEventsCard;
