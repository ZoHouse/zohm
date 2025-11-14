/**
 * Unit tests for canonical UID generation
 * Ensures deduplication logic works correctly
 */

import { canonicalUid, isValidCanonicalUid, areEventsDuplicate, generateCanonicalUids } from '../canonicalUid';
import { ParsedEvent } from '../icalParser';

describe('canonicalUid', () => {
  describe('basic functionality', () => {
    it('should generate a 12-character hex string', () => {
      const event: ParsedEvent = {
        'Event Name': 'Test Event',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Test Location',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const uid = canonicalUid(event);
      expect(uid).toMatch(/^[0-9a-f]{12}$/);
      expect(uid.length).toBe(12);
    });
    
    it('should be deterministic (same input → same output)', () => {
      const event: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const uid1 = canonicalUid(event);
      const uid2 = canonicalUid(event);
      
      expect(uid1).toBe(uid2);
    });
  });
  
  describe('normalization - case insensitive', () => {
    it('should generate same UID for different case variations', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'blockchain meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'zo house sf',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
    
    it('should handle mixed case with special characters', () => {
      const event1: ParsedEvent = {
        'Event Name': 'ETH GLOBAL: Hackathon',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'San Francisco, CA',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'eth global: hackathon',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'san francisco, ca',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
  });
  
  describe('normalization - punctuation', () => {
    it('should handle different punctuation variations', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain Meetup!',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
    
    it('should normalize quotes and apostrophes', () => {
      const event1: ParsedEvent = {
        'Event Name': "Builder's Night",
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': "Builder's Night",
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
  });
  
  describe('normalization - whitespace', () => {
    it('should handle extra whitespace', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain  Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo  House  SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
    
    it('should trim leading/trailing whitespace', () => {
      const event1: ParsedEvent = {
        'Event Name': '  Blockchain Meetup  ',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: '  Zo House SF  ',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
  });
  
  describe('normalization - timestamps', () => {
    it('should handle different timestamp formats (same time)', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00.000Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
    
    it('should differentiate events at different times', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T19:00:00Z',
        Location: 'Zo House SF',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).not.toBe(canonicalUid(event2));
    });
  });
  
  describe('normalization - location URLs', () => {
    it('should normalize Luma URLs', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'https://lu.ma/event123',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Blockchain Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'luma/event123',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(canonicalUid(event1)).toBe(canonicalUid(event2));
    });
  });
  
  describe('edge cases', () => {
    it('should handle missing location', () => {
      const event: ParsedEvent = {
        'Event Name': 'Virtual Meetup',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: '',
        Latitude: '',
        Longitude: '',
      };
      
      const uid = canonicalUid(event);
      expect(isValidCanonicalUid(uid)).toBe(true);
    });
    
    it('should handle events with identical content', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Same Event',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Same Place',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Same Event',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Same Place',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(areEventsDuplicate(event1, event2)).toBe(true);
    });
    
    it('should differentiate truly different events', () => {
      const event1: ParsedEvent = {
        'Event Name': 'Event A',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Location A',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      const event2: ParsedEvent = {
        'Event Name': 'Event B',
        'Date & Time': '2025-11-15T18:00:00Z',
        Location: 'Location B',
        Latitude: '37.7749',
        Longitude: '-122.4194',
      };
      
      expect(areEventsDuplicate(event1, event2)).toBe(false);
    });
  });
  
  describe('batch processing', () => {
    it('should deduplicate multiple events', () => {
      const events: ParsedEvent[] = [
        {
          'Event Name': 'Event 1',
          'Date & Time': '2025-11-15T18:00:00Z',
          Location: 'Location 1',
          Latitude: '37.7749',
          Longitude: '-122.4194',
        },
        {
          'Event Name': 'Event 1', // Duplicate
          'Date & Time': '2025-11-15T18:00:00Z',
          Location: 'Location 1',
          Latitude: '37.7749',
          Longitude: '-122.4194',
        },
        {
          'Event Name': 'Event 2',
          'Date & Time': '2025-11-16T18:00:00Z',
          Location: 'Location 2',
          Latitude: '37.7749',
          Longitude: '-122.4194',
        },
      ];
      
      const uidMap = generateCanonicalUids(events);
      expect(uidMap.size).toBe(2); // Should have 2 unique events
    });
  });
  
  describe('validation', () => {
    it('should validate correct UID format', () => {
      expect(isValidCanonicalUid('a1b2c3d4e5f6')).toBe(true);
      expect(isValidCanonicalUid('000000000000')).toBe(true);
      expect(isValidCanonicalUid('ffffffffffff')).toBe(true);
    });
    
    it('should reject invalid UID formats', () => {
      expect(isValidCanonicalUid('too-short')).toBe(false);
      expect(isValidCanonicalUid('toolongstring123')).toBe(false);
      expect(isValidCanonicalUid('UPPERCASE123')).toBe(false);
      expect(isValidCanonicalUid('invalid!@#$%')).toBe(false);
      expect(isValidCanonicalUid('')).toBe(false);
    });
  });
});

