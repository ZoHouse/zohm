// Metabase API client for fetching activities data
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const METABASE_URL = 'https://metabase.zo.xyz';
const METABASE_EMAIL = process.env.METABASE_EMAIL!;
const METABASE_PASSWORD = process.env.METABASE_PASSWORD!;

// Card IDs from dashboard
const ACTIVITIES_CARD_ID = 354; // Activities Scheduled (All)
const TEMPLATES_CARD_ID = 372; // All Activity Templates

interface MetabaseSession {
  id: string;
}

interface MetabaseQueryResult {
  data: {
    rows: any[][];
    cols: Array<{ name: string; display_name: string; base_type: string }>;
  };
}

interface Activity {
  date: string;
  property: string; // zostel/node name
  activity: string;
  created_at: string;
  sku_id: string;
  completion_status: string | null;
}

interface ActivityTemplate {
  property: string;
  activity_name: string;
  description: string;
  date_added: string;
  date_last_amended: string;
  status: string;
}

// Session token cache
let sessionToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Metabase session token (cached for 14 days)
 */
async function getMetabaseSession(): Promise<string> {
  // Reuse token if still valid
  if (sessionToken && Date.now() < tokenExpiry) {
    return sessionToken;
  }

  const response = await fetch(`${METABASE_URL}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: METABASE_EMAIL,
      password: METABASE_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Metabase auth failed: ${response.statusText}`);
  }

  const data: MetabaseSession = await response.json();
  sessionToken = data.id;
  tokenExpiry = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days

  return sessionToken;
}

/**
 * Query a Metabase card and convert to objects
 */
async function queryMetabaseCard<T = any>(cardId: number): Promise<T[]> {
  const token = await getMetabaseSession();

  const response = await fetch(`${METABASE_URL}/api/card/${cardId}/query`, {
    method: 'POST',
    headers: {
      'X-Metabase-Session': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Metabase query failed: ${response.statusText}`);
  }

  const result: MetabaseQueryResult = await response.json();

  // Convert rows to objects
  const cols = result.data.cols.map(col => col.name);
  return result.data.rows.map(row => {
    const obj: any = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

/**
 * Get all scheduled activities
 */
export async function getAllActivities(): Promise<Activity[]> {
  const data = await queryMetabaseCard<any>(ACTIVITIES_CARD_ID);

  return data.map(row => ({
    date: row.date,
    property: row.zostel || row.property,
    activity: row.activity,
    created_at: row.created_at,
    sku_id: row.sku_id,
    completion_status: row.completion_status,
  }));
}

/**
 * Get property name from node ID
 */
async function getNodePropertyName(nodeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('nodes')
    .select('property_name')
    .eq('id', nodeId)
    .single();

  if (error) {
    console.error(`Error fetching property_name for node ${nodeId}:`, error);
    return null;
  }

  return data?.property_name || null;
}

/**
 * Get activities for a specific node and date
 */
export async function getNodeActivities(
  nodeId: string,
  date: string
): Promise<Activity[]> {
  const allActivities = await getAllActivities();

  // Get property name from database
  const propertyName = await getNodePropertyName(nodeId);
  if (!propertyName) {
    console.warn(`No property_name found for node: ${nodeId}`);
    return [];
  }

  return allActivities.filter(activity => {
    const activityDate = activity.date.split('T')[0];
    return activity.property === propertyName && activityDate === date;
  });
}

/**
 * Calculate daily vibe score for a node
 */
export async function calculateDailyVibeScore(
  nodeId: string,
  date: string
): Promise<number> {
  const activities = await getNodeActivities(nodeId, date);
  const activityCount = activities.length;
  const vibeScore = (activityCount / 4) * 100;

  return vibeScore;
}

/**
 * Calculate weekly vibe score (7-day rolling average)
 */
export async function calculateWeeklyVibeScore(nodeId: string): Promise<number> {
  const allActivities = await getAllActivities();

  // Get property name from database
  const propertyName = await getNodePropertyName(nodeId);
  if (!propertyName) {
    console.warn(`No property_name found for node: ${nodeId}`);
    return 0;
  }

  // Get last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Group by day
  const dailyCounts: { [key: string]: number } = {};

  allActivities
    .filter(activity => activity.property === propertyName)
    .forEach(activity => {
      const date = activity.date.split('T')[0];
      const activityDate = new Date(date);

      if (activityDate >= sevenDaysAgo && activityDate <= today) {
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

  // Calculate daily scores
  const dailyScores = Object.values(dailyCounts).map(count => (count / 4) * 100);

  // Return average
  if (dailyScores.length === 0) return 0;
  return dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length;
}

/**
 * Get all activity templates
 */
export async function getAllActivityTemplates(): Promise<ActivityTemplate[]> {
  const data = await queryMetabaseCard<any>(TEMPLATES_CARD_ID);

  return data.map(row => ({
    property: row.Property,
    activity_name: row['Activity Name'],
    description: row.Description,
    date_added: row['Date Added'],
    date_last_amended: row['Date Last Amended'],
    status: row.Status,
  }));
}

/**
 * Get activity templates for a specific node
 */
export async function getNodeActivityTemplates(
  nodeId: string
): Promise<ActivityTemplate[]> {
  const allTemplates = await getAllActivityTemplates();
  return allTemplates.filter(template => template.property === nodeId);
}

export { getMetabaseSession, queryMetabaseCard };
export type { Activity, ActivityTemplate };
