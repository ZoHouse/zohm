import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapGeoJSONOptions {
  map: mapboxgl.Map | null;
  sourceId: string;
  includeNodes?: boolean;
  enabled?: boolean;
}

export function useMapGeoJSON({ 
  map, 
  sourceId, 
  includeNodes = false,
  enabled = true 
}: UseMapGeoJSONOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureCount, setFeatureCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastBoundsRef = useRef<string | null>(null);

  const fetchGeoJSON = async (bbox?: mapboxgl.LngLatBounds) => {
    if (!map || !enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Get map bounds if not provided
      const bounds = bbox || map.getBounds();
      const west = bounds.getWest();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const north = bounds.getNorth();

      // Check if bounds have changed significantly (avoid redundant fetches)
      const boundsKey = `${west.toFixed(3)},${south.toFixed(3)},${east.toFixed(3)},${north.toFixed(3)}`;
      if (boundsKey === lastBoundsRef.current) {
        setLoading(false);
        return;
      }
      lastBoundsRef.current = boundsKey;

      // Construct API URL
      const params = new URLSearchParams({
        bbox: `${west},${south},${east},${north}`,
        includeNodes: includeNodes.toString()
      });

      const url = `/api/events/geojson?${params}`;
      console.log('🔄 Fetching GeoJSON:', url);
      const startTime = performance.now();

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojson = await response.json();
      const duration = performance.now() - startTime;
      
      console.log(`✅ Loaded ${geojson.features.length} features in ${duration.toFixed(0)}ms`);
      setFeatureCount(geojson.features.length);

      // Update or create source
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points
        });
      }

      setLoading(false);

      // Track performance
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'map_geojson_load', {
          duration_ms: duration,
          feature_count: geojson.features.length,
          zoom: map.getZoom()
        });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🔄 GeoJSON request aborted');
        return;
      }
      console.error('❌ GeoJSON fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Auto-fetch on map move (debounced)
  useEffect(() => {
    if (!map || !enabled) return;

    let timeoutId: NodeJS.Timeout;

    const handleMoveEnd = () => {
      // Debounce: wait 300ms after movement stops
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchGeoJSON();
      }, 300);
    };

    map.on('moveend', handleMoveEnd);

    // Initial fetch
    if (map.loaded()) {
      fetchGeoJSON();
    } else {
      map.once('load', () => fetchGeoJSON());
    }

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [map, sourceId, includeNodes, enabled]);

  return { 
    loading, 
    error, 
    featureCount,
    refetch: fetchGeoJSON 
  };
}

