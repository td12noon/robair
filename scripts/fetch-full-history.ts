/**
 * Fetch Full Flight History from FlightAware API
 *
 * This script fetches all available historical flights for N424BB
 * and stores them in the Supabase database.
 *
 * Usage: npx tsx --env-file=.env.local scripts/fetch-full-history.ts
 */

import { FlightAwareClient } from '../src/lib/flightaware';
import { storeFlights } from '../src/lib/supabase';

const AIRCRAFT_IDENT = 'N424BB';

async function fetchFullHistory() {
  console.log(`\n=== FlightAware Full History Fetch ===`);
  console.log(`Aircraft: ${AIRCRAFT_IDENT}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Check environment variables
  if (!process.env.FLIGHTAWARE_API_KEY) {
    console.error('Error: FLIGHTAWARE_API_KEY environment variable not set');
    console.error('Make sure you have a .env.local file with your API key');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Supabase environment variables not set');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured');
    process.exit(1);
  }

  console.log('Environment variables verified');

  try {
    // Initialize FlightAware client
    const client = new FlightAwareClient();

    // Try fetching with date range to get historical data
    // Go back 6 months from today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    console.log(`\nFetching flights from FlightAware API...`);
    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    console.log(`(This may take a minute due to pagination)\n`);

    // Fetch flights with date range
    const response = await client.getFlightByIdent(AIRCRAFT_IDENT, startDate, endDate, 100);
    const flights = response.flights || [];

    console.log(`\n=== Fetch Results ===`);
    console.log(`Total flights fetched: ${flights.length}`);

    if (flights.length === 0) {
      console.log('No flights found. Check if the aircraft identifier is correct.');
      return;
    }

    // Show sample flight data
    const sampleFlight = flights[0];
    console.log(`\nMost recent flight:`);
    console.log(`  - ID: ${sampleFlight.fa_flight_id}`);
    console.log(`  - Origin: ${sampleFlight.origin?.code || 'N/A'} (${sampleFlight.origin?.name || 'Unknown'})`);
    console.log(`  - Destination: ${sampleFlight.destination?.code || 'N/A'} (${sampleFlight.destination?.name || 'Unknown'})`);
    console.log(`  - Status: ${sampleFlight.status}`);
    console.log(`  - Date: ${sampleFlight.actual_off || sampleFlight.scheduled_off || 'N/A'}`);

    // Show date range
    const dates = flights
      .map(f => f.actual_off || f.scheduled_off)
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      console.log(`\nDate range:`);
      console.log(`  - Oldest: ${dates[0]}`);
      console.log(`  - Newest: ${dates[dates.length - 1]}`);
    }

    // Store flights in database
    console.log(`\nStoring flights in database...`);
    const result = await storeFlights(flights);

    console.log(`\n=== Storage Results ===`);
    console.log(`Stored: ${result.stored}`);
    console.log(`Errors: ${result.errors}`);

    if (result.errors > 0) {
      console.warn('\nSome flights failed to store. Check the logs above for details.');
    }

    console.log(`\n=== Done ===`);
    console.log(`Successfully processed ${flights.length} flights.`);
    console.log(`Verify at: /api/debug/stored-flights?ident=${AIRCRAFT_IDENT}`);

  } catch (error) {
    console.error('\nError fetching flights:', error);
    process.exit(1);
  }
}

// Run the script
fetchFullHistory();
