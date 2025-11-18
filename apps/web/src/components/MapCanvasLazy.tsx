'use client';

import dynamic from 'next/dynamic';
import { ParsedEvent } from '@/lib/icalParser';
import { PartnerNodeRecord } from '@/lib/supabase';

/**
 * Lazy-loaded MapCanvas Component
 * 
 * This wrapper uses Next.js dynamic imports to lazy-load the heavy Mapbox GL JS library
 * only when the map component is actually needed. This significantly reduces the initial
 * bundle size and improves Time to Interactive (TTI) on mobile devices.
 * 
 * Benefits:
 * - Reduces initial bundle by ~500KB
 * - Improves First Contentful Paint (FCP)
 * - Defers Mapbox WebGL initialization until needed
 * - Shows loading state during map initialization
 */

interface MapCanvasProps {
  events: ParsedEvent[];
  nodes?: PartnerNodeRecord[];
  flyToEvent?: ParsedEvent | null;
  flyToNode?: PartnerNodeRecord | null;
  onMapReady?: () => void;
  className?: string;
  shouldAnimateFromSpace?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

// Lazy load the actual MapCanvas component
// ssr: false prevents server-side rendering (Mapbox requires browser APIs)
// loading: shows a placeholder during map initialization
const MapCanvas = dynamic<MapCanvasProps>(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-lg font-semibold">Loading Map...</div>
        <div className="text-sm text-gray-400">Initializing Mapbox GL JS</div>
      </div>
    </div>
  ),
});

/**
 * Lazy Map Canvas Wrapper
 * 
 * Pass-through component that forwards all props to the dynamically loaded MapCanvas.
 * This is the component you should import and use throughout the app.
 */
export default function MapCanvasLazy(props: MapCanvasProps) {
  return <MapCanvas {...props} />;
}



