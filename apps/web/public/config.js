// Supabase Configuration
// Replace these with your actual Supabase project values

const SUPABASE_CONFIG = {
  // Configuration loaded from environment variables at build time
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  
  // Anonymous public key (safe to expose in frontend) 
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'
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