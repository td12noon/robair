import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if both URL and key are properly configured
export const supabase = (supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =============================================
// NEW: Individual Flight Storage
// =============================================

export interface StoredFlight {
  id?: number;
  ident: string;
  fa_flight_id: string;
  operator?: string;
  origin_code?: string;
  destination_code?: string;
  status?: string;
  route_distance?: number;
  aircraft_type?: string;
  flight_date?: string;
  flight_data: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Store multiple flights (upserts by fa_flight_id to avoid duplicates)
 */
export async function storeFlights(flights: any[]): Promise<{ stored: number; errors: number }> {
  if (!supabase || flights.length === 0) {
    return { stored: 0, errors: 0 };
  }

  let stored = 0;
  let errors = 0;

  // Process flights in batches
  const batchSize = 50;
  for (let i = 0; i < flights.length; i += batchSize) {
    const batch = flights.slice(i, i + batchSize);
    
    const flightRows = batch.map(flight => ({
      ident: flight.ident || flight.registration,
      fa_flight_id: flight.fa_flight_id,
      operator: flight.operator || null,
      origin_code: flight.origin?.code || null,
      destination_code: flight.destination?.code || null,
      status: flight.status || null,
      route_distance: flight.route_distance || null,
      aircraft_type: flight.aircraft_type || null,
      flight_date: flight.actual_off || flight.scheduled_off || null,
      flight_data: flight,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('flights')
      .upsert(flightRows, {
        onConflict: 'fa_flight_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error storing flights batch:', error);
      errors += batch.length;
    } else {
      stored += batch.length;
    }
  }

  return { stored, errors };
}

/**
 * Get all stored flights for an aircraft
 */
export async function getStoredFlights(ident: string, limit: number = 200): Promise<any[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('flights')
      .select('flight_data')
      .eq('ident', ident)
      .order('flight_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching stored flights:', error);
      return [];
    }

    return (data || []).map(row => row.flight_data);
  } catch (error) {
    console.error('Error in getStoredFlights:', error);
    return [];
  }
}

/**
 * Get the count of stored flights for an aircraft
 */
export async function getStoredFlightCount(ident: string): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('flights')
      .select('*', { count: 'exact', head: true })
      .eq('ident', ident);

    if (error) {
      console.error('Error counting stored flights:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getStoredFlightCount:', error);
    return 0;
  }
}

/**
 * Check if we need to fetch from API (based on last fetch time)
 */
export async function shouldFetchFromApi(ident: string, maxAgeMinutes: number = 30): Promise<boolean> {
  if (!supabase) {
    return true; // If no Supabase, always fetch from API
  }

  try {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('api_fetch_log')
      .select('last_fetched')
      .eq('ident', ident)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking API fetch log:', error);
      return true;
    }

    if (!data) {
      return true; // No fetch record, should fetch
    }

    // Check if last fetch is older than cutoff
    return new Date(data.last_fetched) < new Date(cutoffTime);
  } catch (error) {
    console.error('Error in shouldFetchFromApi:', error);
    return true;
  }
}

/**
 * Update the API fetch log
 */
export async function updateApiFetchLog(ident: string, flightsFetched: number): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await supabase
      .from('api_fetch_log')
      .upsert({
        ident,
        last_fetched: new Date().toISOString(),
        flights_fetched: flightsFetched,
      }, {
        onConflict: 'ident',
      });

    if (error) {
      console.error('Error updating API fetch log:', error);
    }
  } catch (error) {
    console.error('Error in updateApiFetchLog:', error);
  }
}

/**
 * Get the most recent flight IDs we have stored (to avoid re-fetching)
 */
export async function getRecentFlightIds(ident: string, limit: number = 100): Promise<Set<string>> {
  if (!supabase) {
    return new Set();
  }

  try {
    const { data, error } = await supabase
      .from('flights')
      .select('fa_flight_id')
      .eq('ident', ident)
      .order('flight_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent flight IDs:', error);
      return new Set();
    }

    return new Set((data || []).map(row => row.fa_flight_id));
  } catch (error) {
    console.error('Error in getRecentFlightIds:', error);
    return new Set();
  }
}

// =============================================
// LEGACY: Old cache functions (for backwards compatibility)
// =============================================

export interface FlightDataCache {
  id?: number;
  ident: string;
  data: any;
  last_updated: string;
  created_at?: string;
}

/**
 * @deprecated Use getStoredFlights instead
 */
export async function getCachedFlightData(ident: string, maxAgeMinutes: number = 30): Promise<any | null> {
  try {
    if (!supabase) {
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

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching cached flight data:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error in getCachedFlightData:', error);
    return null;
  }
}

/**
 * @deprecated Use storeFlights instead
 */
export async function setCachedFlightData(ident: string, flightData: any): Promise<boolean> {
  try {
    if (!supabase) {
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

/**
 * @deprecated
 */
export async function clearOldCache(maxAgeHours: number = 24): Promise<void> {
  try {
    if (!supabase) {
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
