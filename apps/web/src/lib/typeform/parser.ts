/**
 * Typeform Response Parser
 *
 * Parses Typeform webhook payloads into EventInquiry data.
 * Matches fields by title (case-insensitive) since field IDs vary per form.
 */

import type { TypeformWebhookPayload, TypeformAnswer } from '@/types/inquiry';

interface ParsedInquiry {
  typeform_token: string;
  host_name: string;
  host_email: string;
  host_phone: string;
  organization: string;
  event_type: string;
  venue_preference: string;
  event_date: string;
  expected_headcount: string;
  budget: string;
  duration: string;
  needs_projector: boolean;
  needs_music: boolean;
  needs_catering: boolean;
  needs_accommodation: boolean;
  needs_convention_hall: boolean;
  needs_outdoor_area: boolean;
  additional_notes: string;
}

function getAnswerText(answer: TypeformAnswer): string {
  if (answer.text) return answer.text;
  if (answer.email) return answer.email;
  if (answer.phone_number) return answer.phone_number;
  if (answer.number != null) return String(answer.number);
  if (answer.choice?.label) return answer.choice.label;
  if (answer.choices?.labels) return answer.choices.labels.join(', ');
  if (answer.boolean != null) return answer.boolean ? 'Yes' : 'No';
  return '';
}

/**
 * Build a lookup from field title (lowercased) → answer value
 */
function buildFieldMap(payload: TypeformWebhookPayload): Map<string, string> {
  const { definition, answers } = payload.form_response;
  const fieldMap = new Map<string, string>();

  // Build id → title mapping
  const idToTitle = new Map<string, string>();
  for (const field of definition.fields) {
    idToTitle.set(field.id, field.title.toLowerCase().trim());
  }

  // Map title → answer value
  for (const answer of answers) {
    const title = idToTitle.get(answer.field.id) || '';
    if (title) {
      fieldMap.set(title, getAnswerText(answer));
    }
  }

  return fieldMap;
}

/**
 * Find a value by matching any of the given keywords against field titles
 */
function findField(fieldMap: Map<string, string>, keywords: string[]): string {
  for (const [title, value] of fieldMap) {
    for (const kw of keywords) {
      if (title.includes(kw)) return value;
    }
  }
  return '';
}

/**
 * Check if any of the given keywords appear in a choices/checklist answer
 */
function hasRequirement(fieldMap: Map<string, string>, checklistKeywords: string[], requirementKeywords: string[]): boolean {
  // Find the checklist field
  const checklistValue = findField(fieldMap, checklistKeywords).toLowerCase();
  return requirementKeywords.some(kw => checklistValue.includes(kw));
}

/**
 * Parse a Typeform webhook payload into a structured inquiry
 */
export function parseTypeformResponse(payload: TypeformWebhookPayload): ParsedInquiry {
  const fieldMap = buildFieldMap(payload);

  return {
    typeform_token: payload.form_response.token,
    host_name: findField(fieldMap, ['name', 'full name']),
    host_email: findField(fieldMap, ['email', 'e-mail']),
    host_phone: findField(fieldMap, ['phone', 'mobile', 'contact']),
    organization: findField(fieldMap, ['company', 'organization', 'organisation', 'org']),
    event_type: findField(fieldMap, ['event type', 'type of event', 'kind of event']),
    venue_preference: findField(fieldMap, ['location', 'preferred location', 'city', 'venue', 'where']),
    event_date: findField(fieldMap, ['date', 'preferred date', 'when']),
    expected_headcount: findField(fieldMap, ['guest', 'headcount', 'people', 'attendee', 'pax', 'how many']),
    budget: findField(fieldMap, ['budget', 'price range', 'spending']),
    duration: findField(fieldMap, ['duration', 'how long', 'days']),
    needs_projector: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['projector', 'av', 'audio visual']),
    needs_music: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['music', 'sound', 'speaker', 'dj']),
    needs_catering: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['catering', 'food', 'f&b', 'meal']),
    needs_accommodation: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['accommodation', 'stay', 'room', 'lodging']),
    needs_convention_hall: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['convention', 'hall', 'large space', 'conference']),
    needs_outdoor_area: hasRequirement(fieldMap, ['requirement', 'checklist', 'need', 'amenities'], ['outdoor', 'garden', 'open air']),
    additional_notes: findField(fieldMap, ['note', 'additional', 'comment', 'anything else', 'special']),
  };
}
