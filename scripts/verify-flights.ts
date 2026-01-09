/**
 * Verify stored flights in database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function verify() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Count total flights
  const { count: totalCount } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true })
    .eq('ident', 'N424BB');

  // Count Angel Flights
  const { count: angelCount } = await supabase
    .from('flights')
    .select('*', { count: 'exact', head: true })
    .eq('ident', 'N424BB')
    .eq('operator', 'NGF');

  // Get date range
  const { data: flights } = await supabase
    .from('flights')
    .select('flight_date, origin_code, destination_code, route_distance, operator')
    .eq('ident', 'N424BB')
    .order('flight_date', { ascending: false })
    .limit(5);

  // Get total distance
  const { data: allFlights } = await supabase
    .from('flights')
    .select('route_distance, operator')
    .eq('ident', 'N424BB');

  const totalDistance = allFlights?.reduce((sum, f) => sum + (f.route_distance || 0), 0) || 0;
  const angelDistance = allFlights?.filter(f => f.operator === 'NGF').reduce((sum, f) => sum + (f.route_distance || 0), 0) || 0;

  console.log('\n=== Database Verification ===');
  console.log(`Total flights for N424BB: ${totalCount}`);
  console.log(`Angel Flights (NGF): ${angelCount}`);
  console.log(`Total distance: ${totalDistance.toLocaleString()} nm`);
  console.log(`Angel Flight distance: ${angelDistance.toLocaleString()} nm`);

  console.log('\n=== Most Recent Flights ===');
  flights?.forEach(f => {
    const isAngel = f.operator === 'NGF' ? ' [ANGEL]' : '';
    console.log(`${f.flight_date?.split('T')[0]} | ${f.origin_code} → ${f.destination_code} | ${f.route_distance} nm${isAngel}`);
  });
}

verify();
