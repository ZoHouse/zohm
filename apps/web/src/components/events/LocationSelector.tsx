'use client';

/**
 * LocationSelector Component
 * 
 * Handles location selection for event creation:
 * - Zo Property: Select from existing nodes
 * - Custom Location: Address autocomplete with Mapbox
 * - Online: Meeting link input
 */

import { useState, useEffect } from 'react';
import { searchAddresses, type AddressSearchResult } from '@/lib/geocoding';
import type { LocationType } from '@/types/events';

interface Node {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  type?: string;
}

interface LocationData {
  location_type: LocationType;
  location_name: string;
  location_address?: string;
  lat?: number;
  lng?: number;
  zo_property_id?: string;
  meeting_point?: string;
  max_capacity?: number;
}

interface LocationSelectorProps {
  value: Partial<LocationData>;
  onChange: (data: Partial<LocationData>) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showCustomName, setShowCustomName] = useState(false);

  // Fetch Zo nodes
  useEffect(() => {
    async function fetchNodes() {
      setLoadingNodes(true);
      try {
        const res = await fetch('/api/nodes/list');
        if (res.ok) {
          const data = await res.json();
          // Filter to zo_house and zostel types
          const zoNodes = (data.nodes || data || []).filter(
            (n: Node) => n.type === 'zo_house' || n.type === 'zostel'
          );
          setNodes(zoNodes);
        }
      } catch (err) {
        console.error('Failed to fetch nodes:', err);
      } finally {
        setLoadingNodes(false);
      }
    }
    fetchNodes();
  }, []);

  // Debounced address search
  useEffect(() => {
    if (!addressQuery || addressQuery.length < 3) {
      setAddressResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const results = await searchAddresses(addressQuery);
        setAddressResults(results);
        setShowAddressDropdown(true);
      } finally {
        setSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const selectLocationType = (type: LocationType) => {
    onChange({
      ...value,
      location_type: type,
      location_name: '',
      location_address: '',
      lat: undefined,
      lng: undefined,
      zo_property_id: undefined,
    });
    setAddressQuery('');
    setShowCustomName(false);
  };

  const selectNode = (node: Node) => {
    // Nodes use latitude/longitude, not lat/lng
    const nodeLat = node.latitude ?? node.lat;
    const nodeLng = node.longitude ?? node.lng;
    
    onChange({
      ...value,
      location_type: 'zo_property',
      location_name: node.name,
      location_address: node.address || '',
      lat: nodeLat,
      lng: nodeLng,
      zo_property_id: node.id,
    });
  };

  const selectAddress = (address: AddressSearchResult) => {
    onChange({
      ...value,
      location_type: 'custom',
      location_name: showCustomName ? value.location_name : address.name,
      location_address: address.address,
      lat: address.lat,
      lng: address.lng,
    });
    setAddressQuery(address.address);
    setShowAddressDropdown(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-full bg-white/20 border border-white/40 text-black font-medium placeholder-black/40 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all";
  const labelClass = "block text-sm font-bold text-black mb-2";

  return (
    <div className="space-y-4">
      <p className="text-black/70 text-sm font-medium">Where will your event take place?</p>
      
      {/* Location Type Selection */}
      <div className="space-y-2">
        {[
          { type: 'zo_property' as LocationType, emoji: '🏠', label: 'Zo Nodes', desc: 'At a Zo House or Zostel' },
          { type: 'custom' as LocationType, emoji: '📍', label: 'Custom Location', desc: 'Search for an address' },
          { type: 'online' as LocationType, emoji: '💻', label: 'Online', desc: 'Virtual event' },
        ].map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => selectLocationType(option.type)}
            className={`
              w-full p-3 rounded-2xl border-2 text-left transition-all
              ${value.location_type === option.type
                ? 'border-[#ff4d6d] bg-[#ff4d6d]/10 shadow-lg'
                : 'border-white/30 bg-white/10 hover:bg-white/20'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{option.emoji}</span>
              <div>
                <p className="font-bold text-black">{option.label}</p>
                <p className="text-xs text-black/60">{option.desc}</p>
              </div>
              {value.location_type === option.type && (
                <span className="ml-auto text-[#ff4d6d] font-bold">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Zo Property Selector */}
      {value.location_type === 'zo_property' && (
        <div className="space-y-3 pt-2">
          <label className={labelClass}>Select Zo Node *</label>
          {loadingNodes ? (
            <div className="p-4 text-center text-black/50">Loading properties...</div>
          ) : nodes.length === 0 ? (
            <div className="p-4 text-center text-black/50">No Zo Nodes found</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => selectNode(node)}
                  className={`
                    w-full p-3 rounded-xl border text-left transition-all
                    ${value.zo_property_id === node.id
                      ? 'border-[#ff4d6d] bg-[#ff4d6d]/10'
                      : 'border-white/30 bg-white/10 hover:bg-white/20'
                    }
                  `}
                >
                  <p className="font-bold text-black">{node.name}</p>
                  {node.address && (
                    <p className="text-xs text-black/60 mt-1">{node.address}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {value.zo_property_id && (
            <div>
              <label className={labelClass}>Meeting Point (optional)</label>
              <input
                type="text"
                value={value.meeting_point || ''}
                onChange={(e) => onChange({ ...value, meeting_point: e.target.value })}
                placeholder="e.g., Reception desk, Rooftop, Cafe area"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Custom Location with Address Search */}
      {value.location_type === 'custom' && (
        <div className="space-y-3 pt-2">
          {/* Custom Venue Name Toggle */}
          <div className="flex items-center justify-between">
            <label className={labelClass}>Search Address *</label>
            <button
              type="button"
              onClick={() => setShowCustomName(!showCustomName)}
              className="text-xs text-[#ff4d6d] font-medium flex items-center gap-1"
            >
              <span className="text-lg">+</span>
              {showCustomName ? 'Hide custom name' : 'Add custom venue name'}
            </button>
          </div>

          {/* Custom Venue Name Input */}
          {showCustomName && (
            <div>
              <input
                type="text"
                value={value.location_name || ''}
                onChange={(e) => onChange({ ...value, location_name: e.target.value })}
                placeholder="Custom venue name (e.g., Joe's Coffee Shop)"
                className={inputClass}
              />
            </div>
          )}

          {/* Address Search */}
          <div className="relative">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => {
                setAddressQuery(e.target.value);
                setShowAddressDropdown(true);
              }}
              onFocus={() => addressResults.length > 0 && setShowAddressDropdown(true)}
              placeholder="Search for an address..."
              className={inputClass}
            />
            {searchingAddress && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#ff4d6d] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Address Dropdown */}
            {showAddressDropdown && addressResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {addressResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => selectAddress(result)}
                    className="w-full p-3 text-left hover:bg-[#ff4d6d]/10 transition-colors border-b border-white/20 last:border-0"
                  >
                    <p className="font-medium text-black text-sm">{result.name}</p>
                    <p className="text-xs text-black/60 truncate">{result.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Address Display */}
          {value.location_address && value.lat && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-800 text-sm font-medium">
                📍 {value.location_address}
              </p>
              {value.location_name && showCustomName && (
                <p className="text-green-700 text-xs mt-1">
                  Venue: {value.location_name}
                </p>
              )}
            </div>
          )}

          {/* Meeting Point */}
          {value.location_address && (
            <div>
              <label className={labelClass}>Meeting Point (optional)</label>
              <input
                type="text"
                value={value.meeting_point || ''}
                onChange={(e) => onChange({ ...value, meeting_point: e.target.value })}
                placeholder="e.g., Front entrance, Back garden"
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Online Event */}
      {value.location_type === 'online' && (
        <div className="space-y-3 pt-2">
          <div>
            <label className={labelClass}>Meeting Link</label>
            <input
              type="url"
              value={value.location_name || ''}
              onChange={(e) => onChange({ ...value, location_name: e.target.value })}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              className={inputClass}
            />
            <p className="text-xs text-black/50 mt-1">
              You can also add the link later before the event
            </p>
          </div>
        </div>
      )}

      {/* Max Capacity */}
      <div className="pt-2">
        <label className={labelClass}>Max Capacity (optional)</label>
        <input
          type="number"
          value={value.max_capacity || ''}
          onChange={(e) => onChange({ ...value, max_capacity: parseInt(e.target.value) || undefined })}
          placeholder="Leave empty for unlimited"
          min={2}
          max={1000}
          className={inputClass}
        />
      </div>
    </div>
  );
}

export default LocationSelector;
