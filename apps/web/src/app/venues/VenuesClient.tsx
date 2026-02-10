'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GlowCard } from '@/components/ui/GlowCard';
import { GlowChip } from '@/components/ui/GlowChip';
import { GlowButton } from '@/components/ui/GlowButton';

type Venue = Record<string, any>;
type FieldTuple = [string, any, string]; // [label, value, columnName]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function fetchVenues(): Promise<Venue[]> {
  const rows: Venue[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Zoeventsmaster?select=*&offset=${offset}&limit=1000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) break;
    rows.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

// ── Helpers ──

function catTextColor(cat: string | null): string {
  switch (cat) {
    case 'Zostel': return 'text-blue-400';
    case 'Zo Houses': return 'text-fuchsia-400';
    case 'Zostel Homes': return 'text-violet-400';
    case 'Zostel Plus': return 'text-emerald-400';
    default: return 'text-white/50';
  }
}

function catChipStyle(cat: string | null): string {
  switch (cat) {
    case 'Zostel': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Zo Houses': return 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30';
    case 'Zostel Homes': return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    case 'Zostel Plus': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default: return 'bg-white/10 text-white/50 border-white/20';
  }
}

function crawlDotColor(status: string | null): string {
  switch (status) {
    case 'ok': return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
    case 'no_access': return 'bg-amber-400';
    case 'error': return 'bg-red-400';
    default: return 'bg-white/30';
  }
}

const TAG_GREEN = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
const TAG_BLUE = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
const TAG_AMBER = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
const TAG_DEFAULT = 'bg-white/10 text-white/40 border-white/15';

function buildTags(r: Venue): { text: string; cls: string }[] {
  const t: { text: string; cls: string }[] = [];
  if (r.convention_hall_available === 'Yes') t.push({ text: `Hall (${r.convention_hall_capacity || '?'} pax)`, cls: TAG_GREEN });
  if (r.events_stage === 'Yes') t.push({ text: 'Stage', cls: TAG_GREEN });
  if (r.has_projector === 'Yes') t.push({ text: 'Projector', cls: TAG_BLUE });
  if (r.has_mic === 'Yes') t.push({ text: 'Mic', cls: TAG_BLUE });
  if (r.has_speakers && r.has_speakers !== 'No' && r.has_speakers !== '') t.push({ text: 'Speakers', cls: TAG_BLUE });
  if (r.swimming_pool === 'Yes') t.push({ text: 'Pool', cls: TAG_BLUE });
  if (r.coworking_room === 'Yes') t.push({ text: 'Coworking', cls: TAG_BLUE });
  if (r.bar_license === 'Yes') t.push({ text: 'Bar License', cls: TAG_AMBER });
  if (r.rooftop_access === 'Yes') t.push({ text: 'Rooftop', cls: TAG_BLUE });
  if (r.has_garden === 'Yes') t.push({ text: 'Garden', cls: TAG_BLUE });
  if (r.pet_friendly === 'Yes') t.push({ text: 'Pet Friendly', cls: TAG_DEFAULT });
  if (r.bonfire_available && r.bonfire_available !== 'No' && r.bonfire_available !== 'NA' && r.bonfire_available !== '') t.push({ text: 'Bonfire', cls: TAG_AMBER });
  if (r.parking_available === 'Yes') t.push({ text: 'Parking', cls: TAG_DEFAULT });
  return t;
}

function hasValue(val: any): boolean {
  return val !== null && val !== undefined && val !== '' && val !== 'NA' && val !== 'na';
}

// ── Editable Field ──

function EditableField({
  label, value, column, venueId, onSave,
}: {
  label: string; value: any; column: string; venueId: string;
  onSave: (column: string, newValue: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === String(value ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column, value: trimmed || null }),
      });
      if (res.ok) {
        onSave(column, trimmed || null as any);
      }
    } catch {}
    setSaving(false);
    setEditing(false);
  }, [draft, value, venueId, column, onSave]);

  const colorClass = value === 'Yes' ? 'text-emerald-400' : value === 'No' ? 'text-white/20' : 'text-white/80';

  if (editing) {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-white/5 gap-1 sm:gap-2">
        <span className="text-xs text-white/40 shrink-0">{label}</span>
        <input
          ref={inputRef}
          className="text-xs font-medium text-right bg-white/10 border border-white/30 rounded px-2 py-1 sm:py-0.5 text-white outline-none focus:border-[#ff4d6d] w-full sm:w-[180px]"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setDraft(String(value ?? '')); } }}
          onBlur={save}
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <div
      className="flex justify-between py-1.5 border-b border-white/5 group cursor-pointer hover:bg-white/5 active:bg-white/10 rounded px-1 -mx-1 transition-colors"
      onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
    >
      <span className="text-xs text-white/40 shrink-0 mr-2">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-xs font-medium text-right max-w-[140px] sm:max-w-[160px] truncate ${colorClass}`}>
          {hasValue(value) ? String(value) : <span className="text-white/10 italic">empty</span>}
        </span>
        <span className="text-white/20 sm:text-white/0 sm:group-hover:text-white/30 text-[10px] transition-colors shrink-0">✎</span>
      </div>
    </div>
  );
}

// ── Section renderers ──

function renderSection(
  title: string,
  fields: FieldTuple[],
  venueId: string,
  onFieldSave: (column: string, newValue: string) => void,
  showEmpty?: boolean,
) {
  const populated = showEmpty ? fields : fields.filter(([, v]) => hasValue(v));
  if (!populated.length) return null;
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-[10px] sm:text-[11px] font-semibold text-[#ff4d6d] uppercase tracking-widest mb-2 sm:mb-3 pb-2 border-b border-white/10">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-0">
        {populated.map(([label, val, col]) => (
          <EditableField
            key={col}
            label={label}
            value={val}
            column={col}
            venueId={venueId}
            onSave={onFieldSave}
          />
        ))}
      </div>
    </div>
  );
}

function renderJsonSection(title: string, val: any) {
  if (!val || (Array.isArray(val) && !val.length)) return null;
  const display = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  const count = Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : 0);
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-[10px] sm:text-[11px] font-semibold text-[#ff4d6d] uppercase tracking-widest mb-2 sm:mb-3 pb-2 border-b border-white/10">
        {title} ({count} items)
      </h3>
      <pre className="bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-[10px] sm:text-[11px] font-mono text-white/50 max-h-[200px] overflow-y-auto overflow-x-auto whitespace-pre-wrap break-all">
        {display}
      </pre>
    </div>
  );
}

// ── Property Detail ──

function PropertyDetail({ venue: initialVenue, onBack }: { venue: Venue; onBack: () => void }) {
  const [r, setR] = useState<Venue>(initialVenue);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleFieldSave = useCallback((column: string, newValue: string) => {
    setR(prev => ({ ...prev, [column]: newValue }));
  }, []);

  const subtitleParts: React.ReactNode[] = [];
  if (r.city) subtitleParts.push(r.city);
  if (r.region) subtitleParts.push(r.region);
  if (r.operational_status === 'Active') {
    subtitleParts.push(<span className="text-emerald-400">Active</span>);
  } else if (r.operational_status) {
    subtitleParts.push(r.operational_status);
  }
  if (r.crawl_status === 'ok') {
    subtitleParts.push(<span className="text-emerald-400">{r.raw_field_count || 0} DCF fields</span>);
  } else {
    subtitleParts.push(`Crawl: ${r.crawl_status || 'none'}`);
  }
  if (r.slack_channel) subtitleParts.push(`Slack: ${r.slack_channel}`);
  if (r.dcf_link) subtitleParts.push(
    <a href={r.dcf_link} target="_blank" rel="noopener noreferrer" className="text-[#ff4d6d] hover:underline">
      Open DCF Sheet →
    </a>
  );

  return (
    <div>
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-14 pb-4 sm:py-6 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3 flex-wrap">
          <GlowButton variant="secondary" onClick={onBack} className="!py-2 !px-4 !text-xs">
            ← Back
          </GlowButton>
          <h1 className="text-lg sm:text-2xl font-bold text-white break-words">{r.property_name}</h1>
          <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${catChipStyle(r.category)}`}>
            {r.category || ''}
          </span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/50 flex-wrap items-center">
          {subtitleParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5 sm:gap-2">
              {i > 0 && <span className="text-white/20">·</span>}
              {part}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-2">Tap any field value to edit · Changes save to Supabase instantly</p>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {renderSection('Identity', [
          ['Category', r.category, 'category'], ['Region', r.region, 'region'], ['City', r.city, 'city'],
          ['Operational Status', r.operational_status, 'operational_status'], ['Onboarded Status', r.onboarded_status, 'onboarded_status'],
          ['Slack Channel', r.slack_channel, 'slack_channel'], ['Latitude', r.latitude, 'latitude'], ['Longitude', r.longitude, 'longitude'],
        ], r.id, handleFieldSave)}
        {renderSection('Event Infrastructure', [
          ['Convention Hall', r.convention_hall_available, 'convention_hall_available'], ['Hall Capacity', r.convention_hall_capacity, 'convention_hall_capacity'],
          ['Hall Charges', r.convention_hall_charges, 'convention_hall_charges'], ['Hall Meal Package', r.convention_hall_meal_pkg, 'convention_hall_meal_pkg'],
          ['Events Stage', r.events_stage, 'events_stage'], ['Projector', r.has_projector, 'has_projector'],
          ['Mic', r.has_mic, 'has_mic'], ['Speakers', r.has_speakers, 'has_speakers'],
          ['Guitar', r.has_guitar, 'has_guitar'], ['Cajon', r.has_cajon, 'has_cajon'],
          ['Keyboard/Synth', r.has_keyboard_synth, 'has_keyboard_synth'], ['Handrum', r.has_handrum, 'has_handrum'],
          ['Music Instruments', r.has_music_instruments, 'has_music_instruments'], ['Other Music', r.other_music_instruments, 'other_music_instruments'],
          ['Common TV', r.has_common_tv, 'has_common_tv'], ['Books/Library', r.has_books_library, 'has_books_library'],
          ['Coworking Room', r.coworking_room, 'coworking_room'], ['Studio', r.studio, 'studio'], ['Lounge', r.lounge, 'lounge'],
        ], r.id, handleFieldSave)}
        {renderSection('Venue Spaces & Layout', [
          ['Garden', r.has_garden, 'has_garden'], ['Living Room', r.has_living_room, 'has_living_room'],
          ['Common Rooms Indoor', r.common_rooms_indoor_count, 'common_rooms_indoor_count'], ['Common Areas Outdoor', r.common_areas_outdoor_count, 'common_areas_outdoor_count'],
          ['Rooftop Access', r.rooftop_access, 'rooftop_access'], ['Rooftop Timings', r.rooftop_access_timings, 'rooftop_access_timings'],
          ['Swimming Pool', r.swimming_pool, 'swimming_pool'], ['Pool Type', r.swimming_pool_type, 'swimming_pool_type'],
          ['Parking', r.parking_available, 'parking_available'], ['Parking Charges', r.parking_charges, 'parking_charges'],
          ['Campus Layout', r.campus_layout, 'campus_layout'], ['Building Layout', r.building_layout, 'building_layout'],
          ['Approach Road', r.approach_road, 'approach_road'], ['Approach Length', r.approach_road_length, 'approach_road_length'],
          ['Water Stations', r.water_stations_count, 'water_stations_count'], ['Common Washroom', r.common_area_washroom, 'common_area_washroom'],
        ], r.id, handleFieldSave)}
        {renderSection('Food & Beverage', [
          ['Breakfast Avg Price', r.breakfast_avg_price, 'breakfast_avg_price'], ['Lunch Avg Price', r.lunch_avg_price, 'lunch_avg_price'],
          ['Dinner Avg Price', r.dinner_avg_price, 'dinner_avg_price'],
          ['Backpacker Meal', r.backpacker_meal_available, 'backpacker_meal_available'], ['Backpacker Price', r.backpacker_meal_price, 'backpacker_meal_price'],
          ['Breakfast Buffet', r.breakfast_buffet_available, 'breakfast_buffet_available'], ['Breakfast Buffet Time', r.breakfast_buffet_time, 'breakfast_buffet_time'],
          ['Meal Buffet', r.meal_buffet_available, 'meal_buffet_available'], ['Lunch Buffet Time', r.lunch_buffet_time, 'lunch_buffet_time'],
          ['Dinner Buffet Time', r.dinner_buffet_time, 'dinner_buffet_time'], ['Menu Link', r.menu_link, 'menu_link'],
          ['Bar License', r.bar_license, 'bar_license'], ['Liquor Available', r.liquor_available, 'liquor_available'],
          ['Liquor Policy', r.liquor_policy, 'liquor_policy'],
          ['Cafe Type', r.cafe_type, 'cafe_type'], ['Cafe Timings', r.cafe_timings, 'cafe_timings'],
          ['Community Kitchen', r.community_kitchen, 'community_kitchen'], ['Kitchen Charges', r.community_kitchen_charges, 'community_kitchen_charges'],
          ['Fridge for Guests', r.fridge_for_travellers, 'fridge_for_travellers'],
        ], r.id, handleFieldSave)}
        {renderSection('Timings', [
          ['Check-in', r.checkin_time, 'checkin_time'], ['Check-out', r.checkout_time, 'checkout_time'],
          ['Silent Hours', r.silent_hours, 'silent_hours'], ['Gate Closing', r.gate_closing_time, 'gate_closing_time'],
        ], r.id, handleFieldSave)}
        {renderSection('WiFi & Connectivity', [
          ['WiFi Available', r.wifi_available, 'wifi_available'], ['Connection Type', r.wifi_connection_type, 'wifi_connection_type'],
          ['Speed: Reception', r.wifi_speed_reception, 'wifi_speed_reception'], ['Speed: Common Area', r.wifi_speed_common_area, 'wifi_speed_common_area'],
          ['Speed: Ground Floor', r.wifi_speed_ground_floor, 'wifi_speed_ground_floor'], ['Speed: First Floor', r.wifi_speed_first_floor, 'wifi_speed_first_floor'],
          ['Speed: Second Floor', r.wifi_speed_second_floor, 'wifi_speed_second_floor'], ['Speed: Common Room', r.wifi_speed_common_room, 'wifi_speed_common_room'],
          ['Speed: Private Room', r.wifi_speed_private_room, 'wifi_speed_private_room'], ['Speed: Dorm', r.wifi_speed_dorm_room, 'wifi_speed_dorm_room'],
          ['Speed: Cafe', r.wifi_speed_cafe, 'wifi_speed_cafe'], ['Speed: Rooftop', r.wifi_speed_rooftop, 'wifi_speed_rooftop'],
          ['Phone Networks', r.phone_networks, 'phone_networks'],
        ], r.id, handleFieldSave)}
        {renderSection('Services & Facilities', [
          ['Bonfire', r.bonfire_available, 'bonfire_available'], ['Bonfire Charges', r.bonfire_charges, 'bonfire_charges'],
          ['Private Bonfire', r.private_bonfire_available, 'private_bonfire_available'], ['Private Bonfire Charges', r.private_bonfire_charges, 'private_bonfire_charges'],
          ['BBQ Grill', r.barbeque_grill, 'barbeque_grill'], ['BBQ Charges', r.barbeque_grill_charges, 'barbeque_grill_charges'],
          ['Hair Dryer', r.hair_dryer_available, 'hair_dryer_available'], ['Hair Dryer Charges', r.hair_dryer_charges, 'hair_dryer_charges'],
          ['Towels', r.towels_available, 'towels_available'], ['Towel Rent', r.towel_rent_charges, 'towel_rent_charges'],
          ['Towel Status', r.towel_price_status, 'towel_price_status'], ['Towel Purchase', r.towel_purchase_charges, 'towel_purchase_charges'],
          ['Room Heater', r.room_heater_available, 'room_heater_available'], ['Heater Charges', r.room_heater_charges, 'room_heater_charges'],
          ['Electric Blanket', r.electric_blanket_available, 'electric_blanket_available'], ['Blanket Charges', r.electric_blanket_charges, 'electric_blanket_charges'],
          ['Pet Friendly', r.pet_friendly, 'pet_friendly'], ['Doctor on Call', r.doctor_on_call, 'doctor_on_call'],
          ['Room Service', r.room_service_available, 'room_service_available'], ['Newspaper', r.newspaper_available, 'newspaper_available'],
          ['Torch', r.torch_available, 'torch_available'], ['Drying Rack', r.drying_rack_available, 'drying_rack_available'],
          ['Ashtray', r.ashtray_available, 'ashtray_available'], ['Cloak Room', r.cloak_room_available, 'cloak_room_available'],
          ['Cloak Room Charges', r.cloak_room_charges, 'cloak_room_charges'], ['Pickle Ball Court', r.pickle_ball_court, 'pickle_ball_court'],
          ['Power Backup', r.power_backup, 'power_backup'], ['Backup Type', r.power_backup_type, 'power_backup_type'],
          ['Umbrellas', r.umbrellas_available, 'umbrellas_available'],
        ], r.id, handleFieldSave)}
        {renderSection('Laundry', [
          ['Self Laundry', r.self_laundry_available, 'self_laundry_available'], ['Machine Charges', r.machine_charges, 'machine_charges'],
          ['Paid Laundry', r.paid_laundry_available, 'paid_laundry_available'], ['Paid Laundry Charges', r.paid_laundry_charges, 'paid_laundry_charges'],
          ['Iron', r.iron_available, 'iron_available'], ['Iron Charges', r.iron_charges, 'iron_charges'],
          ['Paid Ironing', r.paid_ironing_service, 'paid_ironing_service'], ['Ironing Charges', r.paid_ironing_charges, 'paid_ironing_charges'],
        ], r.id, handleFieldSave)}
        {renderSection('Transport & Hire', [
          ['Bike for Hire', r.bike_for_hire, 'bike_for_hire'], ['Bike Charges', r.bike_hire_charges, 'bike_hire_charges'],
          ['Cycle for Hire', r.cycle_for_hire, 'cycle_for_hire'], ['Cycle Charges', r.cycle_hire_charges, 'cycle_hire_charges'],
          ['Car for Hire', r.car_for_hire, 'car_for_hire'], ['Car Charges', r.car_hire_charges, 'car_hire_charges'],
          ['Taxi to Airport', r.taxi_to_airport_charge, 'taxi_to_airport_charge'], ['Taxi to Railway', r.taxi_to_railway_charge, 'taxi_to_railway_charge'],
          ['Taxi to Bus Stand', r.taxi_to_bus_stand_charge, 'taxi_to_bus_stand_charge'],
        ], r.id, handleFieldSave)}
        {renderSection('Distances', [
          ['Airport', r.airport_distance, 'airport_distance'], ['Railway Station', r.railway_station_distance, 'railway_station_distance'],
          ['Bus Stand', r.bus_stand_distance, 'bus_stand_distance'], ['Nearest Restaurant', r.nearest_restaurant_distance, 'nearest_restaurant_distance'],
          ['Hospital', r.nearest_hospital_distance, 'nearest_hospital_distance'], ['Medical Store', r.nearest_medical_store, 'nearest_medical_store'],
          ['Landmark', r.nearest_landmark, 'nearest_landmark'], ['Supermarket', r.nearest_supermarket, 'nearest_supermarket'],
          ['ATM', r.nearest_atm, 'nearest_atm'], ['Vegetable Market', r.nearest_vegetable_market, 'nearest_vegetable_market'],
          ['Bar', r.nearest_bar_distance, 'nearest_bar_distance'], ['Coffee Shop', r.nearest_coffee_shop, 'nearest_coffee_shop'],
        ], r.id, handleFieldSave)}
        {renderSection('Games & Entertainment', [
          ['Board Games', r.has_board_games, 'has_board_games'], ['Monopoly', r.has_monopoly, 'has_monopoly'],
          ['Card Games', r.has_card_games, 'has_card_games'], ['UNO', r.has_uno, 'has_uno'],
          ['Jenga', r.has_jenga, 'has_jenga'], ['Avalon', r.has_avalon, 'has_avalon'],
          ['Table Tennis', r.has_table_tennis, 'has_table_tennis'], ['Chess', r.has_chess, 'has_chess'],
          ['Pool/Snooker', r.has_pool_snooker, 'has_pool_snooker'], ['Ludo', r.has_ludo, 'has_ludo'],
          ['Foosball', r.has_foosball, 'has_foosball'], ['Scrabble', r.has_scrabble, 'has_scrabble'],
          ['Other Games', r.other_games, 'other_games'],
        ], r.id, handleFieldSave)}
        {renderSection('Safety & Security', [
          ['Fire Extinguisher', r.fire_extinguisher, 'fire_extinguisher'], ['Smoke Detectors', r.smoke_detectors, 'smoke_detectors'],
          ['Sanitizer Dispensers', r.sanitizer_dispenser, 'sanitizer_dispenser'], ['Sanitizer Count', r.sanitizer_count, 'sanitizer_count'],
          ['Security Guard', r.security_guard, 'security_guard'], ['Languages Spoken', r.languages_spoken, 'languages_spoken'],
          ['Early Check-in Area', r.early_checkin_waiting_area, 'early_checkin_waiting_area'], ['Early Check-in Charges', r.early_checkin_charges, 'early_checkin_charges'],
        ], r.id, handleFieldSave)}
        {renderSection('Payment Methods', [
          ['Paytm', r.paytm_accepted, 'paytm_accepted'], ['Bank Transfer', r.bank_transfer_accepted, 'bank_transfer_accepted'],
          ['UPI', r.upi_accepted, 'upi_accepted'], ['PayU', r.payu_accepted, 'payu_accepted'],
          ['Card', r.card_accepted, 'card_accepted'], ['Travellers Cheque', r.travellers_cheque_accepted, 'travellers_cheque_accepted'],
        ], r.id, handleFieldSave)}
        {renderSection('Locality & Surroundings', [
          ['Neighbourhood', r.neighbourhood, 'neighbourhood'], ['Staff Presence', r.staff_presence, 'staff_presence'],
          ['Host Accessibility', r.host_accessibility, 'host_accessibility'], ['Event Suitability', r.event_suitability_text, 'event_suitability_text'],
          ['View from Property', r.view_from_property, 'view_from_property'], ['Additional Views', r.additional_views, 'additional_views'],
        ], r.id, handleFieldSave)}
        {renderSection('Ops-Filled: Event Pricing', [
          ['Hourly Rate', r.hourly_rate, 'hourly_rate'], ['Half Day Rate', r.half_day_rate, 'half_day_rate'],
          ['Full Day Rate', r.full_day_rate, 'full_day_rate'], ['Cleanup Fee', r.cleanup_fee, 'cleanup_fee'],
          ['Security Deposit', r.security_deposit, 'security_deposit'], ['Min Booking Hours', r.min_booking_hours, 'min_booking_hours'],
          ['Cancellation Policy', r.cancellation_policy, 'cancellation_policy'],
        ], r.id, handleFieldSave, true)}
        {renderSection('Ops-Filled: Music & Noise', [
          ['Amplified Music', r.amplified_music_allowed, 'amplified_music_allowed'], ['Music Until', r.music_allowed_until, 'music_allowed_until'],
          ['Live Music', r.live_music_allowed, 'live_music_allowed'], ['DJ Allowed', r.dj_allowed, 'dj_allowed'],
          ['Max Noise dB', r.max_noise_level_db, 'max_noise_level_db'], ['Noise Notes', r.noise_restrictions_notes, 'noise_restrictions_notes'],
        ], r.id, handleFieldSave, true)}
        {renderSection('Ops-Filled: Time Slots', [
          ['Morning', r.slot_morning, 'slot_morning'], ['Afternoon', r.slot_afternoon, 'slot_afternoon'],
          ['Evening', r.slot_evening, 'slot_evening'], ['Late Night', r.slot_late_night, 'slot_late_night'],
          ['Earliest Start', r.earliest_start_time, 'earliest_start_time'], ['Latest End', r.latest_end_time, 'latest_end_time'],
          ['Setup Time (min)', r.setup_time_minutes, 'setup_time_minutes'], ['Teardown Time (min)', r.teardown_time_minutes, 'teardown_time_minutes'],
        ], r.id, handleFieldSave, true)}
        {renderSection('Ops-Filled: F&B Packages', [
          ['Appetizer T1', r.appetizer_tier1_price, 'appetizer_tier1_price'], ['Appetizer T2', r.appetizer_tier2_price, 'appetizer_tier2_price'],
          ['Appetizer T3', r.appetizer_tier3_price, 'appetizer_tier3_price'],
          ['Drinks Non-Alc', r.drink_station_non_alc_price, 'drink_station_non_alc_price'], ['Drinks Alc', r.drink_station_alc_price, 'drink_station_alc_price'],
          ['Buffet Veg/pax', r.buffet_veg_per_pax, 'buffet_veg_per_pax'], ['Buffet Non-Veg/pax', r.buffet_nonveg_per_pax, 'buffet_nonveg_per_pax'],
          ['Min Pax Catering', r.min_pax_for_event_catering, 'min_pax_for_event_catering'], ['External Catering', r.external_catering_allowed, 'external_catering_allowed'],
        ], r.id, handleFieldSave, true)}
        {renderSection('Crawl Metadata', [
          ['Crawl Status', r.crawl_status, 'crawl_status'], ['Crawl Error', r.crawl_error, 'crawl_error'],
          ['Crawl Timestamp', r.crawl_timestamp, 'crawl_timestamp'], ['Created At', r.created_at, 'created_at'], ['Updated At', r.updated_at, 'updated_at'],
        ], r.id, handleFieldSave)}
        {renderJsonSection('Rooms (from Rooms in Zo tab)', r.rooms_json)}
        {renderJsonSection('Room Details (per-room amenities)', r.room_details_json)}
        {renderJsonSection('Meals Pricing', r.meals_pricing_json)}
        {renderJsonSection('Team Details', r.team_details_json)}
      </div>
    </div>
  );
}

// ── Main Component ──

export default function VenuesClient() {
  const [data, setData] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCrawl, setFilterCrawl] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterHall, setFilterHall] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetchVenues().then(rows => {
      rows.sort((a, b) => (a.property_name || '').localeCompare(b.property_name || ''));
      setData(rows);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(r => {
      if (s && !(r.property_name || '').toLowerCase().includes(s) && !(r.city || '').toLowerCase().includes(s)) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterCrawl && r.crawl_status !== filterCrawl) return false;
      if (filterRegion && r.region !== filterRegion) return false;
      if (filterHall && r.convention_hall_available !== 'Yes') return false;
      return true;
    });
  }, [data, search, filterCategory, filterCrawl, filterRegion, filterHall]);

  const stats = useMemo(() => {
    const regions: Record<string, number> = {};
    data.forEach(r => { if (r.region) regions[r.region] = (regions[r.region] || 0) + 1; });
    return {
      total: data.length,
      fullData: data.filter(r => r.crawl_status === 'ok').length,
      withHall: data.filter(r => r.convention_hall_available === 'Yes').length,
      regions: Object.entries(regions).sort((a, b) => b[1] - a[1]),
    };
  }, [data]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach(r => { if (r.region) set.add(r.region); });
    return Array.from(set).sort();
  }, [data]);

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterCrawl('');
    setFilterRegion('');
    setFilterHall(false);
  }

  if (selectedVenue) {
    return (
      <div className="h-screen h-[100dvh] overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch" style={{ backgroundColor: '#0A0A0A', backgroundImage: 'none', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', WebkitOverflowScrolling: 'touch' }}>
        <PropertyDetail venue={selectedVenue} onBack={() => setSelectedVenue(null)} />
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] overflow-y-auto overscroll-contain" style={{ backgroundColor: '#0A0A0A', backgroundImage: 'none', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Zo Events Master</h1>
        <p className="text-white/40 text-xs sm:text-sm mt-1">Venue directory — {data.length} properties across India</p>
      </div>

      {/* Stats */}
      <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 sm:flex-wrap">
        <GlowChip onClick={clearFilters} showDot>
          <span className="text-white font-bold text-base sm:text-lg">{stats.total}</span>
          <span className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap">Properties</span>
        </GlowChip>
        <GlowChip onClick={() => setFilterCrawl(filterCrawl === 'ok' ? '' : 'ok')} active={filterCrawl === 'ok'}>
          <span className="text-white font-bold text-base sm:text-lg">{stats.fullData}</span>
          <span className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap">Full Data</span>
        </GlowChip>
        <GlowChip onClick={() => setFilterHall(!filterHall)} active={filterHall}>
          <span className="text-white font-bold text-base sm:text-lg">{stats.withHall}</span>
          <span className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap">With Hall</span>
        </GlowChip>
        {stats.regions.map(([region, count]) => (
          <GlowChip key={region} onClick={() => setFilterRegion(filterRegion === region ? '' : region)} active={filterRegion === region}>
            <span className="text-white font-bold text-base sm:text-lg">{count}</span>
            <span className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap">{region}</span>
          </GlowChip>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 pb-4 sm:flex-wrap sm:items-center">
        <input
          type="text"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/30 rounded-full px-4 sm:px-5 py-2.5 text-sm outline-none focus:border-white/50 focus:bg-white/15 w-full sm:w-72 transition-all"
          placeholder="Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 sm:gap-3 overflow-x-auto">
          <select
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-3 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-white/50 transition-all min-w-0 shrink-0"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Zostel">Zostel</option>
            <option value="Zo Houses">Zo Houses</option>
            <option value="Zostel Homes">Zostel Homes</option>
            <option value="Zostel Plus">Zostel Plus</option>
          </select>
          <select
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-3 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-white/50 transition-all min-w-0 shrink-0"
            value={filterCrawl}
            onChange={e => setFilterCrawl(e.target.value)}
          >
            <option value="">All Data Status</option>
            <option value="ok">Full Data</option>
            <option value="no_access">No Access</option>
            <option value="partial">Partial</option>
          </select>
          <select
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-3 sm:px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-white/50 transition-all min-w-0 shrink-0"
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
          >
            <option value="">All Regions</option>
            {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <span className="text-white/30 text-xs sm:text-sm sm:ml-auto text-right">{filtered.length} venues</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        {loading && (
          <div className="col-span-full text-center py-20 text-white/30 text-sm">Loading from Supabase...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-white/30 text-sm">No matching venues</div>
        )}
        {filtered.map(r => {
          const tags = buildTags(r);
          const crawl = r.crawl_status || '';
          return (
            <GlowCard key={r.id || r.property_name} hoverable onClick={() => setSelectedVenue(r)} className="relative !p-4 sm:!p-5">
              {/* Crawl status dot */}
              <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 rounded-full ${crawlDotColor(crawl)}`} title={`Crawl: ${crawl}`} />

              {/* Name */}
              <div className="text-sm sm:text-[15px] font-semibold text-white leading-tight mb-2 sm:mb-3 pr-4">{r.property_name || 'Unknown'}</div>

              {/* Location + Category */}
              <div className="text-[11px] sm:text-xs text-white/50 mb-2 sm:mb-3">
                {[r.city, r.region].filter(Boolean).join(' · ')}
                {r.category && <> · <span className={catTextColor(r.category)}>{r.category}</span></>}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                  {tags.map(tag => (
                    <span key={tag.text} className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border ${tag.cls}`}>
                      {tag.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-white/30 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${crawlDotColor(crawl)}`} />
                  {crawl === 'ok' ? `${r.raw_field_count || 0} fields` : crawl || 'no data'}
                </span>
                {r.wifi_available === 'Yes' && <span>WiFi {r.wifi_speed_common_area || ''}</span>}
                {r.checkin_time && <span>In {r.checkin_time}</span>}
                {r.checkout_time && <span>Out {r.checkout_time}</span>}
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
