/**
 * Quick validation script for canonical UID logic
 * Run: npx tsx scripts/validate-canonical-uid.ts
 */

import { canonicalUid, areEventsDuplicate, isValidCanonicalUid } from '../apps/web/src/lib/canonicalUid';
import type { ParsedEvent } from '../apps/web/src/lib/icalParser';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error}`);
    failed++;
  }
}

console.log('🧪 Testing Canonical UID Logic\n');

// Test 1: Basic UID generation
test('Generates 12-char hex UID', () => {
  const event: ParsedEvent = {
    'Event Name': 'Test Event',
    'Date & Time': '2025-11-15T18:00:00Z',
    Location: 'Test Location',
    Latitude: '37.7749',
    Longitude: '-122.4194',
  };
  const uid = canonicalUid(event);
  return uid.length === 12 && isValidCanonicalUid(uid);
});

// Test 2: Deterministic (same input = same output)
test('Is deterministic', () => {
  const event: ParsedEvent = {
    'Event Name': 'Blockchain Meetup',
    'Date & Time': '2025-11-15T18:00:00Z',
    Location: 'Zo House SF',
    Latitude: '37.7749',
    Longitude: '-122.4194',
  };
  return canonicalUid(event) === canonicalUid(event);
});

// Test 3: Case insensitive
test('Handles different cases', () => {
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
  return canonicalUid(event1) === canonicalUid(event2);
});

// Test 4: Punctuation normalization
test('Normalizes punctuation', () => {
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
  return canonicalUid(event1) === canonicalUid(event2);
});

// Test 5: Whitespace normalization
test('Handles extra whitespace', () => {
  const event1: ParsedEvent = {
    'Event Name': 'Blockchain  Meetup',
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
  return canonicalUid(event1) === canonicalUid(event2);
});

// Test 6: Different events get different UIDs
test('Different events have different UIDs', () => {
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
  return canonicalUid(event1) !== canonicalUid(event2);
});

// Test 7: Different times get different UIDs
test('Different times have different UIDs', () => {
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
  return canonicalUid(event1) !== canonicalUid(event2);
});

// Test 8: Duplicate detection helper
test('areEventsDuplicate works correctly', () => {
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
  return areEventsDuplicate(event1, event2);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

