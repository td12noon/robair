import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { getCachedFlightData } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident') || 'N424BB';

    console.log('=== DEBUG: Fetching flights for:', ident);

    // Try to get cached data first (30 minute expiration)
    let cachedData = await getCachedFlightData(ident, 30);
    let response;

    if (cachedData) {
      console.log('=== DEBUG: Using cached data');
      response = { flights: cachedData.flights, num_pages: 1 };
    } else {
      console.log('=== DEBUG: Cache miss, fetching from FlightAware API...');
      // Get raw FlightAware response
      const flights = await flightAware.getCurrentFlights(ident, 100);
      response = { flights, num_pages: 1 };
    }

    console.log('=== DEBUG: Raw FlightAware response structure:', {
      flightsCount: response.flights?.length || 0,
      numPages: response.num_pages,
      hasLinks: !!response.links,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      maxPagesRequested: 100
    });

    // Log first flight details if available
    if (response.flights && response.flights.length > 0) {
      const firstFlight = response.flights[0];
      console.log('=== DEBUG: First flight details:', {
        ident: firstFlight.ident,
        fa_flight_id: firstFlight.fa_flight_id,
        operator: firstFlight.operator,
        route_distance: firstFlight.route_distance,
        scheduled_off: firstFlight.scheduled_off,
        actual_off: firstFlight.actual_off,
        status: firstFlight.status,
        origin: firstFlight.origin,
        destination: firstFlight.destination,
        aircraft_type: firstFlight.aircraft_type
      });
    }

    // Calculate current year flights
    const currentYear = new Date().getFullYear();
    const thisYearFlights = response.flights?.filter(flight => {
      const flightDate = new Date(flight.actual_off || flight.scheduled_off || '');
      const flightYear = flightDate.getFullYear();
      console.log(`Flight ${flight.fa_flight_id}: ${flight.actual_off || flight.scheduled_off} -> Year: ${flightYear}, Current: ${currentYear}, Match: ${flightYear === currentYear}`);
      return flightYear === currentYear;
    }) || [];

    console.log('=== DEBUG: Filtered flights for', currentYear, ':', thisYearFlights.length);

    return NextResponse.json({
      debug: true,
      ident,
      currentYear,
      totalFlights: response.flights?.length || 0,
      thisYearFlights: thisYearFlights.length,
      rawResponse: {
        flights: response.flights?.slice(0, 3) || [], // First 3 flights for inspection
        num_pages: response.num_pages
      },
      filteredFlights: thisYearFlights.slice(0, 3), // First 3 filtered flights
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== DEBUG: Error fetching flights:', error);

    if (error instanceof FlightAwareError) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        status: error.status,
        debug: true
      }, { status: error.status || 500 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: true
    }, { status: 500 });
  }
}