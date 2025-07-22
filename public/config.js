// Supabase Configuration
// Replace these with your actual Supabase project values

const SUPABASE_CONFIG = {
  // Your Supabase Project URL
  url: 'https://elvaqxadfewcsohrsswsi.supabase.co',
  
  // Your Supabase Anonymous Public Key (safe to expose in frontend)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdmFxeGFkZmV3Y3NvaHJzd3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODkxMTUsImV4cCI6MjA2ODc2NTExNX0.OD_lY6X6ynXR0kj6xuZPoUApRmeRvt4wHuayCmtsN8Q'
};

// Instructions:
// 1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
// 2. Select your project  
// 3. Go to Settings > API
// 4. Copy the "Project URL" and paste it as the url value above
// 5. Copy the "anon public" key and paste it as the anonKey value above

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}

// Make available globally for static HTML
window.SUPABASE_CONFIG = SUPABASE_CONFIG; 