// Supabase Client Configuration
// Note: In a static HTML project, we'll load configuration from config.js
// In production, these should be loaded securely

// Configuration will be loaded from config.js (window.SUPABASE_CONFIG)
// Make sure to include config.js before this file in your HTML

// Load Supabase client from CDN (will be loaded in HTML)
// Assuming @supabase/supabase-js is loaded globally as 'supabase'

let supabaseClient = null;

// Initialize Supabase client
function initializeSupabase() {
  // Check if Supabase SDK is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase SDK not loaded. Make sure to include the CDN script in your HTML.');
    return null;
  }

  // Check if configuration is loaded
  if (typeof window.SUPABASE_CONFIG === 'undefined') {
    console.error('Supabase configuration not loaded. Make sure to include config.js before this file.');
    return null;
  }

  const config = window.SUPABASE_CONFIG;

  // Validate configuration
  if (!config.url || !config.anonKey) {
    console.error('Invalid Supabase configuration. Please check your config.js file.');
    return null;
  }

  if (config.url === 'https://YOUR-PROJECT.supabase.co' || config.anonKey === 'your-anon-key-here') {
    console.error('Please update config.js with your actual Supabase project credentials.');
    return null;
  }

  // Create Supabase client
  try {
    supabaseClient = supabase.createClient(
      config.url,
      config.anonKey
    );
    
    console.log('✅ Supabase client initialized successfully');
    console.log('🔗 Connected to:', config.url);
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    return null;
  }
}

// Test connection function
async function pingSupabase() {
  if (!supabaseClient) {
    console.error('Supabase client not initialized. Call initializeSupabase() first.');
    return false;
  }

  try {
    // Test connection by checking if we can query a simple table
    // If no tables exist, this will still test the connection
    const { data, error } = await supabaseClient
      .from('members') // Change to 'test' or any table you have
      .select('*')
      .limit(1);

    if (error) {
      // If table doesn't exist, that's okay - connection works
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Supabase connection working! (Table "members" not found, but connection is valid)');
        console.log('💡 Create a "members" table in Supabase to test data retrieval');
        return true;
      } else {
        console.error('❌ Supabase connection error:', error);
        return false;
      }
    }

    console.log('✅ Supabase connection successful! Data:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to ping Supabase:', error);
    return false;
  }
}

// Get the initialized client
function getSupabaseClient() {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized. Initializing now...');
    return initializeSupabase();
  }
  return supabaseClient;
}

// Export for other modules (if using ES6 modules)
// For static HTML, these functions will be available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeSupabase,
    getSupabaseClient,
    pingSupabase,
    supabaseClient: () => supabaseClient
  };
}

// Make functions available globally for static HTML
window.SupabaseClient = {
  initialize: initializeSupabase,
  getClient: getSupabaseClient,
  ping: pingSupabase,
  client: () => supabaseClient
}; 