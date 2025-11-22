'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useZoAuth } from './useZoAuth';

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  location?: string;
  category?: string;
  image_url?: string;
  is_free: boolean;
}

export interface DashboardQuest {
  id: string;
  slug: string;
  title: string;
  description: string;
  reward: number;
  category?: string;
  image_url?: string;
}

export interface VisitedNode {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  image_url?: string;
}

export function useDashboardData() {
  const { userProfile } = useZoAuth();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [quests, setQuests] = useState<DashboardQuest[]>([]);
  const [visitedNodes, setVisitedNodes] = useState<VisitedNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch upcoming events using lat/lng bounding box (same as map)
        let eventsQuery = supabase
          .from('canonical_events')
          .select('id, title, description, starts_at, location_raw, lat, lng, category, raw_payload, is_free')
          .gte('starts_at', new Date().toISOString())
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .order('starts_at', { ascending: true });

        // Filter by user's location if available (using bounding box like the map does)
        if (userProfile?.lat && userProfile?.lng) {
          // Create a bounding box around user's location (~50km radius)
          // Roughly 0.5 degrees latitude/longitude ≈ 55km
          const radiusDegrees = 0.5;
          const bbox = {
            south: userProfile.lat - radiusDegrees,
            north: userProfile.lat + radiusDegrees,
            west: userProfile.lng - radiusDegrees,
            east: userProfile.lng + radiusDegrees,
          };

          console.log('📍 Fetching local events around:', {
            lat: userProfile.lat,
            lng: userProfile.lng,
            city: userProfile.city,
            bbox,
          });

          eventsQuery = eventsQuery
            .gte('lat', bbox.south)
            .lte('lat', bbox.north)
            .gte('lng', bbox.west)
            .lte('lng', bbox.east);
        } else {
          console.log('⚠️ No user location, fetching all upcoming events');
        }

        const { data: eventsData, error: eventsError } = await eventsQuery.limit(10);

        console.log('📊 Events query result:', { 
          count: eventsData?.length, 
          error: eventsError?.message,
          sampleEvents: eventsData?.slice(0, 3).map(e => ({ 
            title: e.title, 
            location: e.location_raw,
            lat: e.lat,
            lng: e.lng,
          }))
        });

        if (eventsError) {
          console.warn('Unable to fetch events:', eventsError.message);
          // Keep empty array as fallback
        } else if (eventsData && eventsData.length > 0) {
          // Map the data to match the DashboardEvent interface
          setEvents(eventsData.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            start_time: event.starts_at,
            location: event.location_raw,
            category: event.category,
            image_url: event.raw_payload?.image_url || '/dashboard-assets/rectangle-738.png',
            is_free: event.is_free ?? true,
          })));
        }

        // Fetch available quests
        const { data: questsData, error: questsError } = await supabase
          .from('quests')
          .select('id, slug, title, description, reward, category, image_url')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        if (questsError) {
          console.warn('Unable to fetch quests:', questsError.message);
          // Provide fallback quest data for UI display
          setQuests([{
            id: 'default-1',
            slug: 'complete-wall-app-profile',
            title: 'Complete Wall.app Profile',
            description: 'Deep understanding of Web3 and product development to create seamless, gamified platforms that empower decentralized communities.',
            reward: 100,
            category: 'social',
            image_url: '/dashboard-assets/4e45e0263bd2e484e1118ee4c3da505c26e22145-1.png',
          }]);
        } else if (questsData && questsData.length > 0) {
          setQuests(questsData);
        } else {
          // No quests available, use fallback
          setQuests([{
            id: 'default-1',
            slug: 'complete-wall-app-profile',
            title: 'Complete Wall.app Profile',
            description: 'Deep understanding of Web3 and product development to create seamless, gamified platforms that empower decentralized communities.',
            reward: 100,
            category: 'social',
            image_url: '/dashboard-assets/4e45e0263bd2e484e1118ee4c3da505c26e22145-1.png',
          }]);
        }

        // Fetch visited nodes (if user has location history)
        if (userProfile?.id) {
          const { data: nodesData, error: nodesError } = await supabase
            .from('nodes')
            .select('id, name, city, latitude, longitude, image_url')
            .order('created_at', { ascending: false })
            .limit(5);

          if (nodesError) {
            console.warn('Unable to fetch nodes:', nodesError.message);
            // Keep empty array as fallback
          } else if (nodesData) {
            // Map latitude/longitude to lat/lng for consistency
            setVisitedNodes(nodesData.map(node => ({
              id: node.id,
              name: node.name,
              city: node.city,
              lat: node.latitude,
              lng: node.longitude,
              image_url: node.image_url,
            })));
          }
        }
      } catch (error) {
        console.warn('Unable to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userProfile?.id]);

  return {
    events,
    quests,
    visitedNodes,
    loading,
  };
}

