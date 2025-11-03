'use client';

import React, { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  BecomeCofounder,
  BuildZoWorld,
  MasterPlan,
  TravelLocalFriends,
  TravelWithZo,
  Welcome,
} from "./sections";
import { Header, Footer } from "./common";
import { getNodesFromDB, getQuests } from '@/lib/supabase';
import { fetchAllCalendarEventsWithGeocoding } from '@/lib/icalParser';
import { getCalendarUrls } from '@/lib/calendarConfig';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface LandingPageNewProps {
  onEnterGame: () => void;
}

const LandingPageNew: React.FC<LandingPageNewProps> = ({ onEnterGame }) => {
  const [stats, setStats] = useState({
    events: 0,
    nodes: 0,
    quests: 0,
  });

  // Fetch real-time stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch nodes count
        const nodesData = await getNodesFromDB();
        const activeNodes = (nodesData || []).filter(node => node.status === 'active').length;

        // Fetch quests count
        const questsData = await getQuests();
        const activeQuests = (questsData || []).filter(quest => quest.status === 'active').length;

        // Fetch events count (upcoming events)
        const calendarUrls = await getCalendarUrls();
        const events = await fetchAllCalendarEventsWithGeocoding(calendarUrls);
        const now = new Date();
        const upcomingEvents = events.filter(event => {
          const eventDate = new Date(event['Date & Time']);
          return eventDate >= now;
        }).length;

        setStats({
          events: upcomingEvents,
          nodes: activeNodes,
          quests: activeQuests,
        });

        console.log('📊 Real-time stats loaded for new landing page:', { events: upcomingEvents, nodes: activeNodes, quests: activeQuests });
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        // Fallback to default values
        setStats({
          events: 156,
          nodes: 89,
          quests: 24,
        });
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cleanup ScrollTriggers on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <Header />
      <section className="overflow-x-hidden w-full h-full">
        <Welcome onEnterGame={onEnterGame} stats={stats} />
        <TravelLocalFriends />
        <BecomeCofounder />
        <BuildZoWorld />
        <TravelWithZo />
        <MasterPlan />
      </section>
      <Footer />
    </>
  );
};

export default LandingPageNew;

