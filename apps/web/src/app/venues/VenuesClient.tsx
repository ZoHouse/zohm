'use client';

import { useState, useEffect, useMemo } from 'react';
import { GlowCard } from '@/components/ui/GlowCard';
import { GlowChip } from '@/components/ui/GlowChip';
import { GlowButton } from '@/components/ui/GlowButton';

type Venue = Record<string, any>;

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

// ── Section renderers ──

function renderSection(title: string, fields: [string, any][]) {
  const populated = fields.filter(([, v]) => hasValue(v));
  if (!populated.length) return null;
  return (
    <div className="mb-6">
      <h3 className="text-[11px] font-semibold text-[#ff4d6d] uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
        {title}
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-1">
        {populated.map(([label, val]) => (
          <div key={label} className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-xs text-white/40">{label}</span>
            <span className={`text-xs font-medium text-right max-w-[160px] truncate ${
              val === 'Yes' ? 'text-emerald-400' : val === 'No' ? 'text-white/20' : 'text-white/80'
            }`}>
              {String(val)}
            </span>
          </div>
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
    <div className="mb-6">
      <h3 className="text-[11px] font-semibold text-[#ff4d6d] uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
        {title} ({count} items)
      </h3>
      <pre className="bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-white/50 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all">
        {display}
      </pre>
    </div>
  );
}

// ── Property Detail ──

function PropertyDetail({ venue: r, onBack }: { venue: Venue; onBack: () => void }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

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
      <div className="px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <GlowButton variant="secondary" onClick={onBack} className="!py-2 !px-4 !text-xs">
            ← Back
          </GlowButton>
          <h1 className="text-2xl font-bold text-white">{r.property_name}</h1>
          <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${catChipStyle(r.category)}`}>
            {r.category || ''}
          </span>
        </div>
        <div className="flex gap-2 text-sm text-white/50 flex-wrap items-center">
          {subtitleParts.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/20">·</span>}
              {part}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        {renderSection('Identity', [
          ['Category', r.category], ['Region', r.region], ['City', r.city],
          ['Operational Status', r.operational_status], ['Onboarded Status', r.onboarded_status],
          ['Slack Channel', r.slack_channel], ['Latitude', r.latitude], ['Longitude', r.longitude],
        ])}
        {renderSection('Event Infrastructure', [
          ['Convention Hall', r.convention_hall_available], ['Hall Capacity', r.convention_hall_capacity],
          ['Hall Charges', r.convention_hall_charges], ['Hall Meal Package', r.convention_hall_meal_pkg],
          ['Events Stage', r.events_stage], ['Projector', r.has_projector],
          ['Mic', r.has_mic], ['Speakers', r.has_speakers],
          ['Guitar', r.has_guitar], ['Cajon', r.has_cajon],
          ['Keyboard/Synth', r.has_keyboard_synth], ['Handrum', r.has_handrum],
          ['Music Instruments', r.has_music_instruments], ['Other Music', r.other_music_instruments],
          ['Common TV', r.has_common_tv], ['Books/Library', r.has_books_library],
          ['Coworking Room', r.coworking_room], ['Studio', r.studio], ['Lounge', r.lounge],
        ])}
        {renderSection('Venue Spaces & Layout', [
          ['Garden', r.has_garden], ['Living Room', r.has_living_room],
          ['Common Rooms Indoor', r.common_rooms_indoor_count], ['Common Areas Outdoor', r.common_areas_outdoor_count],
          ['Rooftop Access', r.rooftop_access], ['Rooftop Timings', r.rooftop_access_timings],
          ['Swimming Pool', r.swimming_pool], ['Pool Type', r.swimming_pool_type],
          ['Parking', r.parking_available], ['Parking Charges', r.parking_charges],
          ['Campus Layout', r.campus_layout], ['Building Layout', r.building_layout],
          ['Approach Road', r.approach_road], ['Approach Length', r.approach_road_length],
          ['Water Stations', r.water_stations_count], ['Common Washroom', r.common_area_washroom],
        ])}
        {renderSection('Food & Beverage', [
          ['Breakfast Avg Price', r.breakfast_avg_price], ['Lunch Avg Price', r.lunch_avg_price],
          ['Dinner Avg Price', r.dinner_avg_price],
          ['Backpacker Meal', r.backpacker_meal_available], ['Backpacker Price', r.backpacker_meal_price],
          ['Breakfast Buffet', r.breakfast_buffet_available], ['Breakfast Buffet Time', r.breakfast_buffet_time],
          ['Meal Buffet', r.meal_buffet_available], ['Lunch Buffet Time', r.lunch_buffet_time],
          ['Dinner Buffet Time', r.dinner_buffet_time], ['Menu Link', r.menu_link],
          ['Bar License', r.bar_license], ['Liquor Available', r.liquor_available],
          ['Liquor Policy', r.liquor_policy],
          ['Cafe Type', r.cafe_type], ['Cafe Timings', r.cafe_timings],
          ['Community Kitchen', r.community_kitchen], ['Kitchen Charges', r.community_kitchen_charges],
          ['Fridge for Guests', r.fridge_for_travellers],
        ])}
        {renderSection('Timings', [
          ['Check-in', r.checkin_time], ['Check-out', r.checkout_time],
          ['Silent Hours', r.silent_hours], ['Gate Closing', r.gate_closing_time],
        ])}
        {renderSection('WiFi & Connectivity', [
          ['WiFi Available', r.wifi_available], ['Connection Type', r.wifi_connection_type],
          ['Speed: Reception', r.wifi_speed_reception], ['Speed: Common Area', r.wifi_speed_common_area],
          ['Speed: Ground Floor', r.wifi_speed_ground_floor], ['Speed: First Floor', r.wifi_speed_first_floor],
          ['Speed: Second Floor', r.wifi_speed_second_floor], ['Speed: Common Room', r.wifi_speed_common_room],
          ['Speed: Private Room', r.wifi_speed_private_room], ['Speed: Dorm', r.wifi_speed_dorm_room],
          ['Speed: Cafe', r.wifi_speed_cafe], ['Speed: Rooftop', r.wifi_speed_rooftop],
          ['Phone Networks', r.phone_networks],
        ])}
        {renderSection('Services & Facilities', [
          ['Bonfire', r.bonfire_available], ['Bonfire Charges', r.bonfire_charges],
          ['Private Bonfire', r.private_bonfire_available], ['Private Bonfire Charges', r.private_bonfire_charges],
          ['BBQ Grill', r.barbeque_grill], ['BBQ Charges', r.barbeque_grill_charges],
          ['Hair Dryer', r.hair_dryer_available], ['Hair Dryer Charges', r.hair_dryer_charges],
          ['Towels', r.towels_available], ['Towel Rent', r.towel_rent_charges],
          ['Towel Status', r.towel_price_status], ['Towel Purchase', r.towel_purchase_charges],
          ['Room Heater', r.room_heater_available], ['Heater Charges', r.room_heater_charges],
          ['Electric Blanket', r.electric_blanket_available], ['Blanket Charges', r.electric_blanket_charges],
          ['Pet Friendly', r.pet_friendly], ['Doctor on Call', r.doctor_on_call],
          ['Room Service', r.room_service_available], ['Newspaper', r.newspaper_available],
          ['Torch', r.torch_available], ['Drying Rack', r.drying_rack_available],
          ['Ashtray', r.ashtray_available], ['Cloak Room', r.cloak_room_available],
          ['Cloak Room Charges', r.cloak_room_charges], ['Pickle Ball Court', r.pickle_ball_court],
          ['Power Backup', r.power_backup], ['Backup Type', r.power_backup_type],
          ['Umbrellas', r.umbrellas_available],
        ])}
        {renderSection('Laundry', [
          ['Self Laundry', r.self_laundry_available], ['Machine Charges', r.machine_charges],
          ['Paid Laundry', r.paid_laundry_available], ['Paid Laundry Charges', r.paid_laundry_charges],
          ['Iron', r.iron_available], ['Iron Charges', r.iron_charges],
          ['Paid Ironing', r.paid_ironing_service], ['Ironing Charges', r.paid_ironing_charges],
        ])}
        {renderSection('Transport & Hire', [
          ['Bike for Hire', r.bike_for_hire], ['Bike Charges', r.bike_hire_charges],
          ['Cycle for Hire', r.cycle_for_hire], ['Cycle Charges', r.cycle_hire_charges],
          ['Car for Hire', r.car_for_hire], ['Car Charges', r.car_hire_charges],
          ['Taxi to Airport', r.taxi_to_airport_charge], ['Taxi to Railway', r.taxi_to_railway_charge],
          ['Taxi to Bus Stand', r.taxi_to_bus_stand_charge],
        ])}
        {renderSection('Distances', [
          ['Airport', r.airport_distance], ['Railway Station', r.railway_station_distance],
          ['Bus Stand', r.bus_stand_distance], ['Nearest Restaurant', r.nearest_restaurant_distance],
          ['Hospital', r.nearest_hospital_distance], ['Medical Store', r.nearest_medical_store],
          ['Landmark', r.nearest_landmark], ['Supermarket', r.nearest_supermarket],
          ['ATM', r.nearest_atm], ['Vegetable Market', r.nearest_vegetable_market],
          ['Bar', r.nearest_bar_distance], ['Coffee Shop', r.nearest_coffee_shop],
        ])}
        {renderSection('Games & Entertainment', [
          ['Board Games', r.has_board_games], ['Monopoly', r.has_monopoly],
          ['Card Games', r.has_card_games], ['UNO', r.has_uno],
          ['Jenga', r.has_jenga], ['Avalon', r.has_avalon],
          ['Table Tennis', r.has_table_tennis], ['Chess', r.has_chess],
          ['Pool/Snooker', r.has_pool_snooker], ['Ludo', r.has_ludo],
          ['Foosball', r.has_foosball], ['Scrabble', r.has_scrabble],
          ['Other Games', r.other_games],
        ])}
        {renderSection('Safety & Security', [
          ['Fire Extinguisher', r.fire_extinguisher], ['Smoke Detectors', r.smoke_detectors],
          ['Sanitizer Dispensers', r.sanitizer_dispenser], ['Sanitizer Count', r.sanitizer_count],
          ['Security Guard', r.security_guard], ['Languages Spoken', r.languages_spoken],
          ['Early Check-in Area', r.early_checkin_waiting_area], ['Early Check-in Charges', r.early_checkin_charges],
        ])}
        {renderSection('Payment Methods', [
          ['Paytm', r.paytm_accepted], ['Bank Transfer', r.bank_transfer_accepted],
          ['UPI', r.upi_accepted], ['PayU', r.payu_accepted],
          ['Card', r.card_accepted], ['Travellers Cheque', r.travellers_cheque_accepted],
        ])}
        {renderSection('Locality & Surroundings', [
          ['Neighbourhood', r.neighbourhood], ['Staff Presence', r.staff_presence],
          ['Host Accessibility', r.host_accessibility], ['Event Suitability', r.event_suitability_text],
          ['View from Property', r.view_from_property], ['Additional Views', r.additional_views],
        ])}
        {renderSection('Ops-Filled: Event Pricing', [
          ['Hourly Rate', r.hourly_rate], ['Half Day Rate', r.half_day_rate],
          ['Full Day Rate', r.full_day_rate], ['Cleanup Fee', r.cleanup_fee],
          ['Security Deposit', r.security_deposit], ['Min Booking Hours', r.min_booking_hours],
          ['Cancellation Policy', r.cancellation_policy],
        ])}
        {renderSection('Ops-Filled: Music & Noise', [
          ['Amplified Music', r.amplified_music_allowed], ['Music Until', r.music_allowed_until],
          ['Live Music', r.live_music_allowed], ['DJ Allowed', r.dj_allowed],
          ['Max Noise dB', r.max_noise_level_db], ['Noise Notes', r.noise_restrictions_notes],
        ])}
        {renderSection('Ops-Filled: Time Slots', [
          ['Morning', r.slot_morning], ['Afternoon', r.slot_afternoon],
          ['Evening', r.slot_evening], ['Late Night', r.slot_late_night],
          ['Earliest Start', r.earliest_start_time], ['Latest End', r.latest_end_time],
          ['Setup Time (min)', r.setup_time_minutes], ['Teardown Time (min)', r.teardown_time_minutes],
        ])}
        {renderSection('Ops-Filled: F&B Packages', [
          ['Appetizer T1', r.appetizer_tier1_price], ['Appetizer T2', r.appetizer_tier2_price],
          ['Appetizer T3', r.appetizer_tier3_price],
          ['Drinks Non-Alc', r.drink_station_non_alc_price], ['Drinks Alc', r.drink_station_alc_price],
          ['Buffet Veg/pax', r.buffet_veg_per_pax], ['Buffet Non-Veg/pax', r.buffet_nonveg_per_pax],
          ['Min Pax Catering', r.min_pax_for_event_catering], ['External Catering', r.external_catering_allowed],
        ])}
        {renderSection('Crawl Metadata', [
          ['Crawl Status', r.crawl_status], ['Crawl Error', r.crawl_error],
          ['Crawl Timestamp', r.crawl_timestamp], ['Created At', r.created_at], ['Updated At', r.updated_at],
        ])}
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
      return true;
    });
  }, [data, search, filterCategory, filterCrawl, filterRegion]);

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
  }

  if (selectedVenue) {
    return (
      <div className="min-h-screen">
        <PropertyDetail venue={selectedVenue} onBack={() => setSelectedVenue(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-6">
        <h1 className="text-2xl font-bold text-white">Zo Events Master</h1>
        <p className="text-white/40 text-sm mt-1">Venue directory — {data.length} properties across India</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-8 py-4 flex-wrap">
        <GlowChip onClick={clearFilters} showDot>
          <span className="text-white font-bold text-lg">{stats.total}</span>
          <span className="text-white/50 text-[10px] uppercase tracking-wider">Properties</span>
        </GlowChip>
        <GlowChip onClick={() => setFilterCrawl('ok')}>
          <span className="text-white font-bold text-lg">{stats.fullData}</span>
          <span className="text-white/50 text-[10px] uppercase tracking-wider">Full Data</span>
        </GlowChip>
        <GlowChip onClick={() => setFilterCrawl('')}>
          <span className="text-white font-bold text-lg">{stats.withHall}</span>
          <span className="text-white/50 text-[10px] uppercase tracking-wider">With Hall</span>
        </GlowChip>
        {stats.regions.map(([region, count]) => (
          <GlowChip key={region} onClick={() => setFilterRegion(region)}>
            <span className="text-white font-bold text-lg">{count}</span>
            <span className="text-white/50 text-[10px] uppercase tracking-wider">{region}</span>
          </GlowChip>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 px-8 pb-4 flex-wrap items-center">
        <input
          type="text"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/30 rounded-full px-5 py-2.5 text-sm outline-none focus:border-white/50 focus:bg-white/15 w-72 transition-all"
          placeholder="Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:border-white/50 transition-all"
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
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:border-white/50 transition-all"
          value={filterCrawl}
          onChange={e => setFilterCrawl(e.target.value)}
        >
          <option value="">All Data Status</option>
          <option value="ok">Full Data</option>
          <option value="no_access">No Access</option>
          <option value="partial">Partial</option>
        </select>
        <select
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:border-white/50 transition-all"
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value)}
        >
          <option value="">All Regions</option>
          {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-white/30 text-sm ml-auto">{filtered.length} venues</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 px-8 pb-8">
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
            <GlowCard key={r.id || r.property_name} hoverable onClick={() => setSelectedVenue(r)} className="relative !p-5">
              {/* Crawl status dot */}
              <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${crawlDotColor(crawl)}`} title={`Crawl: ${crawl}`} />

              {/* Name */}
              <div className="text-[15px] font-semibold text-white leading-tight mb-3">{r.property_name || 'Unknown'}</div>

              {/* Location + Category */}
              <div className="text-xs text-white/50 mb-3">
                {[r.city, r.region].filter(Boolean).join(' · ')}
                {r.category && <> · <span className={catTextColor(r.category)}>{r.category}</span></>}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map(tag => (
                    <span key={tag.text} className={`text-[10px] px-2 py-0.5 rounded-full border ${tag.cls}`}>
                      {tag.text}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex gap-4 text-[11px] text-white/30">
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
