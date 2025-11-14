/**
 * Map Clustering Utilities
 * Mapbox GL clustering setup and interaction handlers
 */

import mapboxgl from 'mapbox-gl';

export const GEOJSON_SOURCE_ID = 'events-and-nodes';

/**
 * Setup clustering layers on the map
 * Creates 4 layers: clusters, cluster-count, unclustered-events, unclustered-nodes
 */
export function setupClusteringLayers(map: mapboxgl.Map) {
  if (!map) return;

  try {
    // 1. Cluster circles (showing count)
    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          // Graduated circle sizes and colors based on point count
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6', // < 10 points: blue
            10,
            '#f1f075', // 10-30 points: yellow
            30,
            '#f28cb1', // 30-100 points: pink
            100,
            '#ff4d6d'  // > 100 points: red
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,  // < 10 points: 20px
            10,
            30,  // 10-30 points: 30px
            30,
            40,  // 30-100 points: 40px
            100,
            50   // > 100 points: 50px
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
      console.log('✅ Added clusters layer');
    }

    // 2. Cluster count labels
    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: GEOJSON_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
      console.log('✅ Added cluster-count layer');
    }

    // 3. Unclustered event points
    if (!map.getLayer('unclustered-events')) {
      map.addLayer({
        id: 'unclustered-events',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['all', 
          ['!', ['has', 'point_count']], 
          ['==', ['get', 'type'], 'event']
        ],
        paint: {
          'circle-color': '#ff4d6d',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
      console.log('✅ Added unclustered-events layer');
    }

    // 4. Unclustered node points
    if (!map.getLayer('unclustered-nodes')) {
      map.addLayer({
        id: 'unclustered-nodes',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['all', 
          ['!', ['has', 'point_count']], 
          ['==', ['get', 'type'], 'node']
        ],
        paint: {
          'circle-color': '#cfff50',
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
      console.log('✅ Added unclustered-nodes layer');
    }

    console.log('✅ All clustering layers added successfully');
  } catch (error) {
    console.error('❌ Error adding clustering layers:', error);
  }
}

/**
 * Setup click handlers for clusters and points
 */
export function setupClusterClickHandlers(map: mapboxgl.Map) {
  if (!map) return;

  // Click on cluster: zoom in to expand
  map.on('click', 'clusters', (e) => {
    if (!e.features || e.features.length === 0) return;

    const features = e.features;
    const clusterId = features[0].properties?.cluster_id;
    if (!clusterId) return;

    const source = map.getSource(GEOJSON_SOURCE_ID) as mapboxgl.GeoJSONSource;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom: zoom || map.getZoom() + 2
      });
    });
  });

  // Click on unclustered event: show popup
  map.on('click', 'unclustered-events', (e) => {
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const coordinates = (feature.geometry as any).coordinates.slice();
    const props = feature.properties;

    // Ensure popup doesn't go off-screen on date line
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupContent = `
      <div style="padding: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${props?.name || "Event"}</h3>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📅 ${props?.formatted_date || ''}</p>
        ${props?.location && !props.location.includes('luma.com') ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${props.location}</p>` : '<div style="margin-bottom: 16px;"></div>'}
        <div style="display: flex; gap: 8px;">
          ${props?.event_url ? `<a href="${props.event_url}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Register</a>` : ''}
          <button onclick="window.showRouteTo(${coordinates[0]}, ${coordinates[1]})" class="glow-popup-button" style="flex: 1;">Directions</button>
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      className: 'node-popup-clean',
      closeButton: false,
      closeOnClick: true,
      offset: [0, -15],
      maxWidth: '280px',
      anchor: 'bottom'
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  });

  // Click on unclustered node: show popup
  map.on('click', 'unclustered-nodes', (e) => {
    if (!e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const coordinates = (feature.geometry as any).coordinates.slice();
    const props = feature.properties;

    const popupContent = `
      <div style="padding: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${props?.name || "Node"}</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${props?.city || ''}, ${props?.country || ''}</p>
        <div style="display: flex; gap: 8px;">
          ${props?.website ? `<a href="${props.website}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Visit</a>` : ''}
          <button onclick="window.showRouteTo(${coordinates[0]}, ${coordinates[1]})" class="glow-popup-button" style="flex: 1;">Directions</button>
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      className: 'node-popup-clean',
      closeButton: false,
      closeOnClick: true,
      offset: [0, -15],
      maxWidth: '280px',
      anchor: 'bottom'
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);
  });

  // Change cursor on hover
  ['clusters', 'unclustered-events', 'unclustered-nodes'].forEach(layerId => {
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });
  });

  console.log('✅ Cluster click handlers added');
}

/**
 * Remove clustering layers from map
 */
export function removeClusteringLayers(map: mapboxgl.Map) {
  if (!map) return;

  const layers = ['clusters', 'cluster-count', 'unclustered-events', 'unclustered-nodes'];
  
  layers.forEach(layerId => {
    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch (error) {
      console.warn(`Could not remove layer ${layerId}:`, error);
    }
  });

  try {
    if (map.getSource(GEOJSON_SOURCE_ID)) {
      map.removeSource(GEOJSON_SOURCE_ID);
    }
  } catch (error) {
    console.warn(`Could not remove source ${GEOJSON_SOURCE_ID}:`, error);
  }

  console.log('✅ Clustering layers removed');
}

