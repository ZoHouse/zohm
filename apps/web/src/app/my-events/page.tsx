'use client';

/**
 * My Events Page
 * 
 * A dedicated page for users to manage their events:
 * - View and edit hosted events
 * - Manage RSVPs for hosted events
 * - View RSVP'd events
 * - Create new events
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Calendar, MapPin, Users, Pencil, ExternalLink, 
  ChevronRight, ChevronDown, UserCheck, Clock, Loader2
} from 'lucide-react';
import { useZoAuth } from '@/hooks/useZoAuth';
import { GlowButton, GlowCard } from '@/components/ui';
import { EditEventModal } from '@/components/events/EditEventModal';
import { HostEventModal } from '@/components/events/HostEventModal';
import { getCultureAssetUrl, EventCulture } from '@/types/events';
import { devLog } from '@/lib/logger';
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
  max_capacity?: number;
  submission_status: string;
  current_rsvp_count?: number;
  cover_image_url?: string;
}

interface RsvpEvent {
  id: string;
  event_id: string;
  status: string;
  event?: MyEvent;
}

interface RsvpAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  rsvp_type: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  user?: {
    id: string;
    name?: string;
    pfp?: string;
    phone?: string;
    zo_pid?: string;
  };
}

// Culture asset file mapping
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

export default function MyEventsPage() {
  const router = useRouter();
  const { authenticated, userProfile, isLoading: authLoading } = useZoAuth();
  
  const [hostedEvents, setHostedEvents] = useState<MyEvent[]>([]);
  const [rsvpEvents, setRsvpEvents] = useState<RsvpEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hosted' | 'attending' | 'past'>('hosted');
  
  // Modal states
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);
  
  // RSVP management states
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventRsvps, setEventRsvps] = useState<Record<string, RsvpAttendee[]>>({});
  const [loadingRsvps, setLoadingRsvps] = useState<string | null>(null);
  const [updatingRsvp, setUpdatingRsvp] = useState<string | null>(null);

  const fetchMyEvents = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/events/mine', {
        headers: {
          'x-user-id': userProfile.id,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await res.json();
      setHostedEvents(data.hosted || []);
      setRsvpEvents(data.rsvps || []);
      setPastEvents(data.past || []);
      setError(null);
    } catch (err) {
      devLog.error('Failed to fetch my events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  // Fetch RSVPs for a specific event
  const fetchEventRsvps = useCallback(async (eventId: string) => {
    if (!userProfile?.id) return;

    try {
      setLoadingRsvps(eventId);
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        headers: {
          'x-user-id': userProfile.id,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch RSVPs');
      }

      const data = await res.json();
      setEventRsvps(prev => ({
        ...prev,
        [eventId]: data.attendees || [],
      }));
    } catch (err) {
      devLog.error('Failed to fetch RSVPs:', err);
    } finally {
      setLoadingRsvps(null);
    }
  }, [userProfile?.id]);

  // Toggle RSVP list expansion
  const toggleRsvpList = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      if (!eventRsvps[eventId]) {
        fetchEventRsvps(eventId);
      }
    }
  };

  // Update RSVP status (approve/reject/check-in)
  const updateRsvpStatus = async (eventId: string, rsvpId: string, newStatus: string) => {
    if (!userProfile?.id) return;

    try {
      setUpdatingRsvp(rsvpId);
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userProfile.id,
        },
        body: JSON.stringify({
          rsvp_id: rsvpId,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update RSVP');
      }

      // Refresh RSVPs for this event
      await fetchEventRsvps(eventId);
      // Also refresh main events to update counts
      await fetchMyEvents();
    } catch (err) {
      devLog.error('Failed to update RSVP:', err);
    } finally {
      setUpdatingRsvp(null);
    }
  };

  useEffect(() => {
    if (authenticated && userProfile?.id) {
      fetchMyEvents();
    }
  }, [authenticated, userProfile?.id, fetchMyEvents]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/');
    }
  }, [authLoading, authenticated, router]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      'approved': { label: 'Live', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.2)' },
      'pending': { label: 'Pending', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.2)' },
      'draft': { label: 'Draft', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.2)' },
      'rejected': { label: 'Rejected', color: '#F44336', bg: 'rgba(244, 67, 54, 0.2)' },
      'cancelled': { label: 'Cancelled', color: '#9E9E9E', bg: 'rgba(158, 158, 158, 0.2)' },
    };
    return statusConfig[status] || statusConfig['draft'];
  };

  const getRsvpStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      'pending': { label: 'Pending Approval', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.2)' },
      'going': { label: 'Going', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.2)' },
      'interested': { label: 'Pending Approval', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.2)' },
      'waitlist': { label: 'Waitlist', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.2)' },
      'not_going': { label: 'Not Going', color: '#F44336', bg: 'rgba(244, 67, 54, 0.2)' },
      'cancelled': { label: 'Cancelled', color: '#9E9E9E', bg: 'rgba(158, 158, 158, 0.2)' },
      'approved': { label: 'Approved', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.2)' },
      'rejected': { label: 'Rejected', color: '#F44336', bg: 'rgba(244, 67, 54, 0.2)' },
    };
    return statusConfig[status] || statusConfig['interested'];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-black via-[#1a0a10] to-black scrollbar-hide">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">My Events</h1>
              <p className="text-sm text-white/60">Manage your events</p>
            </div>
          </div>
          <GlowButton onClick={() => setShowHostModal(true)} className="!py-2 !px-4">
            <Plus size={18} className="mr-2" />
            Host Event
          </GlowButton>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4 overflow-x-auto">
        <div className="flex gap-1 p-1 bg-white/5 rounded-full w-fit">
          <button
            onClick={() => setActiveTab('hosted')}
            className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === 'hosted'
                ? 'bg-[#ff4d6d] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Hosted ({hostedEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('attending')}
            className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === 'attending'
                ? 'bg-[#ff4d6d] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Attending ({rsvpEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition-all ${
              activeTab === 'past'
                ? 'bg-[#ff4d6d] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Past ({pastEvents.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-white/60">Loading events...</div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <GlowButton onClick={fetchMyEvents}>Try Again</GlowButton>
          </div>
        ) : activeTab === 'hosted' ? (
          /* Hosted Events */
          <div className="space-y-4">
            {hostedEvents.length === 0 ? (
              <GlowCard className="p-8 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">No hosted events yet</h3>
                <p className="text-white/60 mb-6">
                  Start hosting events to build your community
                </p>
                <GlowButton onClick={() => setShowHostModal(true)}>
                  <Plus size={18} className="mr-2" />
                  Host Your First Event
                </GlowButton>
              </GlowCard>
            ) : (
              hostedEvents.map((event) => {
                const status = getStatusBadge(event.submission_status);
                const isExpanded = expandedEventId === event.id;
                const rsvps = eventRsvps[event.id] || [];
                const isLoadingRsvps = loadingRsvps === event.id;
                const coverUrl = getEventCoverImage({
                  coverImageUrl: event.cover_image_url,
                  culture: event.culture as EventCulture,
                  category: 'community',
                });
                
                return (
                  <GlowCard key={event.id} className="p-0 overflow-hidden">
                    {/* Cover Image - always show with default fallback */}
                    <div className="w-full h-32 overflow-hidden">
                      <img
                        src={coverUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Culture Image */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                          <img
                            src={getCultureAssetUrl(getCultureAssetFile(event.culture))}
                            alt={event.culture}
                            className="w-12 h-12 object-contain"
                            loading="lazy"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                            <span
                              className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: status.bg, color: status.color }}
                            >
                              {status.label}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                              <Calendar size={14} />
                              <span>{formatEventDate(event.starts_at)}</span>
                            </div>
                            {event.location_name && (
                              <div className="flex items-center gap-2 text-white/60 text-sm">
                                <MapPin size={14} />
                                <span className="truncate">{event.location_name}</span>
                              </div>
                            )}
                            {event.max_capacity && (
                              <div className="flex items-center gap-2 text-white/60 text-sm">
                                <Users size={14} />
                                <span>{event.current_rsvp_count || 0} / {event.max_capacity} attending</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                        <button
                          onClick={() => setEditingEvent(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleRsvpList(event.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                            isExpanded 
                              ? 'bg-[#ff4d6d] text-white' 
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <UserCheck size={16} />
                          RSVPs
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <button
                          onClick={() => window.open(`/events/${event.id}`, '_blank')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>

                    {/* RSVP Management Section */}
                    {isExpanded && (
                      <div className="border-t border-white/10 bg-black/30">
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                            <Users size={16} />
                            Registered Attendees ({rsvps.length})
                          </h4>

                          {isLoadingRsvps ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                            </div>
                          ) : rsvps.length === 0 ? (
                            <div className="text-center py-8 text-white/40">
                              <Users size={32} className="mx-auto mb-2 opacity-50" />
                              <p>No RSVPs yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {rsvps.map((rsvp) => {
                                const isUpdating = updatingRsvp === rsvp.id;
                                
                                return (
                                  <div
                                    key={rsvp.id}
                                    className="p-3 bg-white/5 rounded-xl"
                                  >
                                    {/* Top row: Avatar + Name + Date */}
                                    <div className="flex items-center gap-3 mb-3">
                                      {/* User Avatar */}
                                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {rsvp.user?.pfp ? (
                                          <img 
                                            src={rsvp.user.pfp} 
                                            alt={rsvp.user.name || 'User'} 
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-white/60 text-sm font-medium">
                                            {(rsvp.user?.name || 'U')[0].toUpperCase()}
                                          </span>
                                        )}
                                      </div>

                                      {/* User Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium">
                                          {rsvp.user?.name || 'Anonymous'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                          <Clock size={10} />
                                          <span>
                                            {new Date(rsvp.created_at).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bottom row: Status Selection Buttons - Full width on mobile */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => updateRsvpStatus(event.id, rsvp.id, 'going')}
                                        disabled={isUpdating || rsvp.status === 'going'}
                                        className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                                          rsvp.status === 'going'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white/10 text-white/60 hover:bg-green-500/30 hover:text-green-400'
                                        }`}
                                      >
                                        {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Going'}
                                      </button>
                                      <button
                                        onClick={() => updateRsvpStatus(event.id, rsvp.id, 'not_going')}
                                        disabled={isUpdating || rsvp.status === 'not_going'}
                                        className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                                          rsvp.status === 'not_going' || rsvp.status === 'cancelled'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white/10 text-white/60 hover:bg-red-500/30 hover:text-red-400'
                                        }`}
                                      >
                                        {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Decline'}
                                      </button>
                                      <button
                                        onClick={() => updateRsvpStatus(event.id, rsvp.id, 'waitlist')}
                                        disabled={isUpdating || rsvp.status === 'waitlist'}
                                        className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${
                                          rsvp.status === 'waitlist'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white/10 text-white/60 hover:bg-orange-500/30 hover:text-orange-400'
                                        }`}
                                      >
                                        {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Waitlist'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </GlowCard>
                );
              })
            )}
          </div>
        ) : activeTab === 'attending' ? (
          /* Attending Events (RSVPs) */
          <div className="space-y-4">
            {rsvpEvents.length === 0 ? (
              <GlowCard className="p-8 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-white mb-2">No events yet</h3>
                <p className="text-white/60 mb-6">
                  Explore events on the map and RSVP to join the community
                </p>
                <GlowButton onClick={() => router.push('/')}>
                  <MapPin size={18} className="mr-2" />
                  Explore Events
                </GlowButton>
              </GlowCard>
            ) : (
              rsvpEvents.map((rsvp) => {
                const event = rsvp.event;
                if (!event) return null;
                
                const rsvpStatus = getRsvpStatusBadge(rsvp.status);
                const coverUrl = getEventCoverImage({
                  coverImageUrl: event.cover_image_url,
                  culture: event.culture as EventCulture,
                  category: 'community',
                });
                return (
                  <GlowCard key={rsvp.id} className="p-0 overflow-hidden">
                    {/* Cover Image - always show with default fallback */}
                    <div className="w-full h-24 overflow-hidden">
                      <img
                        src={coverUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Culture Image */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                          <img
                            src={getCultureAssetUrl(getCultureAssetFile(event.culture))}
                            alt={event.culture}
                            className="w-10 h-10 object-contain"
                            loading="lazy"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-white truncate">{event.title}</h3>
                            <span
                              className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: rsvpStatus.bg, color: rsvpStatus.color }}
                            >
                              {rsvpStatus.label}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formatEventDate(event.starts_at)}</span>
                            </div>
                            {event.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span className="truncate">{event.location_name}</span>
                              </div>
                            )}
                          </div>

                          {/* Associated Quests Section */}
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-white/40">No quests available for this event</p>
                            {/* TODO: When quests are linked to events, show them here:
                            <div className="flex items-center gap-2 p-2 bg-[#ff4d6d]/10 rounded-lg">
                              <span className="text-lg">🎯</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">Quest Name</p>
                                <p className="text-xs text-white/60">+50 XP</p>
                              </div>
                              <ChevronRight size={16} className="text-[#ff4d6d]" />
                            </div>
                            */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                );
              })
            )}
          </div>
        ) : activeTab === 'past' ? (
          /* Past Events */
          <div className="space-y-4">
            {pastEvents.length === 0 ? (
              <GlowCard className="p-8 text-center">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-xl font-bold text-white mb-2">No past events</h3>
                <p className="text-white/60">
                  Events you&apos;ve attended will appear here
                </p>
              </GlowCard>
            ) : (
              pastEvents.map((event) => {
                const coverUrl = getEventCoverImage({
                  coverImageUrl: event.cover_image_url,
                  culture: event.culture as EventCulture,
                  category: 'community',
                });
                return (
                  <GlowCard key={event.id} className="p-0 overflow-hidden opacity-80">
                    {/* Cover Image - always show with default fallback */}
                    <div className="w-full h-24 overflow-hidden">
                      <img
                        src={coverUrl}
                        alt={event.title}
                        className="w-full h-full object-cover grayscale"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Culture Image */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                          <img
                            src={getCultureAssetUrl(getCultureAssetFile(event.culture))}
                            alt={event.culture}
                            className="w-10 h-10 object-contain grayscale"
                            loading="lazy"
                          />
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold text-white/80 truncate">{event.title}</h3>
                            <span className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                              Completed
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/50 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>
                                {new Date(event.starts_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            {event.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span className="truncate">{event.location_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                );
              })
            )}
          </div>
        ) : null}
      </main>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        userId={userProfile?.id}
        onSuccess={() => {
          setEditingEvent(null);
          fetchMyEvents();
        }}
      />

      {/* Host Event Modal */}
      <HostEventModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        userId={userProfile?.id}
        onSuccess={() => {
          setShowHostModal(false);
          fetchMyEvents();
        }}
      />
    </div>
  );
}
