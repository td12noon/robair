import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident') || 'N424BB';

    console.log('=== DEBUG: Fetching flights for:', ident);

    // Get raw FlightAware response with date range and max_pages
    const endDate = new Date();
    const startDate = new Date('2024-01-01'); // Start from beginning of 2024
    const response = await flightAware.getFlightByIdent(ident, startDate, endDate, 100);

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
        scheduled_out: firstFlight.scheduled_out,
        actual_out: firstFlight.actual_out,
        status: firstFlight.status,
        origin: firstFlight.origin,
        destination: firstFlight.destination,
        aircraft_type: firstFlight.aircraft_type
      });
    }

    // Calculate current year flights
    const currentYear = new Date().getFullYear();
    const thisYearFlights = response.flights?.filter(flight => {
      const flightDate = new Date(flight.actual_out || flight.scheduled_out || '');
      const flightYear = flightDate.getFullYear();
      console.log(`Flight ${flight.fa_flight_id}: ${flight.actual_out || flight.scheduled_out} -> Year: ${flightYear}, Current: ${currentYear}, Match: ${flightYear === currentYear}`);
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