/**
 * Canonical UID Generation for Event Deduplication
 * 
 * Generates deterministic unique identifiers for events to prevent duplicates
 * from multiple calendar sources.
 * 
 * Strategy:
 * - Normalize event data (lowercase, trim, consistent formatting)
 * - Hash with SHA256
 * - Use first 12 characters (sufficient for collision avoidance)
 * 
 * Collision probability with 12-char hex:
 * - 16^12 = ~281 trillion possibilities
 * - With 1M events, collision chance ≈ 1 in 280 million
 */

import crypto from 'crypto';
import { ParsedEvent } from './icalParser';

/**
 * Normalizes location string for consistent hashing
 * Handles URLs, addresses, and special characters
 */
function normalizeLocation(location: string | undefined): string {
  if (!location) return '';
  
  return location
    .toLowerCase()
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Normalize commas
    .replace(/,\s*/g, ',')
    // Remove common URL prefixes for Luma links
    .replace(/https?:\/\/(www\.)?lu\.ma\//gi, 'luma/')
    // Remove trailing slashes
    .replace(/\/+$/, '');
}

/**
 * Normalizes event title for consistent hashing
 * Handles case, punctuation, and special characters
 */
function normalizeTitle(title: string | undefined): string {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Normalize common punctuation variations
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/–/g, '-')
    // Remove trailing punctuation
    .replace(/[!?.]+$/, '');
}

/**
 * Generates canonical UID from event data
 * 
 * @param event - Parsed event from iCal feed
 * @returns 12-character hex string (deterministic)
 * 
 * @example
 * const event1 = { 'Event Name': 'Blockchain Meetup!', Location: 'Zo House SF', 'Date & Time': '2025-11-15T18:00:00Z' };
 * const event2 = { 'Event Name': 'blockchain meetup', Location: 'zo house sf', 'Date & Time': '2025-11-15T18:00:00.000Z' };
 * canonicalUid(event1) === canonicalUid(event2) // true (same event)
 */
export function canonicalUid(event: ParsedEvent): string {
  // Normalize timestamp to ISO string (removes ms variations)
  const normalizedTimestamp = new Date(event['Date & Time']).toISOString();
  
  // Create deterministic object
  const normalized = {
    title: normalizeTitle(event['Event Name']),
    location: normalizeLocation(event.Location),
    startsAt: normalizedTimestamp,
  };
  
  // Sort keys for consistency (though object literal order is preserved in modern JS)
  const sortedKeys = Object.keys(normalized).sort();
  const sortedNormalized = sortedKeys.reduce((acc, key) => {
    acc[key] = normalized[key as keyof typeof normalized];
    return acc;
  }, {} as Record<string, string>);
  
  // Generate SHA256 hash
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(sortedNormalized))
    .digest('hex');
  
  // Return first 12 characters (sufficient for our use case)
  return hash.substring(0, 12);
}

/**
 * Validates if a UID looks correct (12-char hex)
 */
export function isValidCanonicalUid(uid: string): boolean {
  return /^[0-9a-f]{12}$/.test(uid);
}

/**
 * Batch generate UIDs for multiple events
 * Useful for worker processing
 */
export function generateCanonicalUids(events: ParsedEvent[]): Map<string, ParsedEvent> {
  const uidMap = new Map<string, ParsedEvent>();
  
  for (const event of events) {
    const uid = canonicalUid(event);
    
    // Keep first occurrence if duplicate (prefer earlier source)
    if (!uidMap.has(uid)) {
      uidMap.set(uid, event);
    }
  }
  
  return uidMap;
}

/**
 * Check if two events are duplicates
 */
export function areEventsDuplicate(event1: ParsedEvent, event2: ParsedEvent): boolean {
  return canonicalUid(event1) === canonicalUid(event2);
}





