import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for flight data caching
export interface FlightDataCache {
  id?: number;
  ident: string;
  data: any; // JSON field containing flight data
  last_updated: string;
  created_at?: string;
}

// Cache flight data with expiration
export async function getCachedFlightData(ident: string, maxAgeMinutes: number = 30): Promise<any | null> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, skipping cache');
      return null;
    }

    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('flight_data_cache')
      .select('*')
      .eq('ident', ident)
      .gt('last_updated', cutoffTime)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching cached flight data:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error in getCachedFlightData:', error);
    return null;
  }
}

// Store flight data in cache
export async function setCachedFlightData(ident: string, flightData: any): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, skipping cache storage');
      return false;
    }

    const { error } = await supabase
      .from('flight_data_cache')
      .upsert({
        ident,
        data: flightData,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'ident'
      });

    if (error) {
      console.error('Error storing cached flight data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setCachedFlightData:', error);
    return false;
  }
}

// Clear old cache entries (cleanup function)
export async function clearOldCache(maxAgeHours: number = 24): Promise<void> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('flight_data_cache')
      .delete()
      .lt('last_updated', cutoffTime);

    if (error) {
      console.error('Error clearing old cache:', error);
    }
  } catch (error) {
    console.error('Error in clearOldCache:', error);
  }
}