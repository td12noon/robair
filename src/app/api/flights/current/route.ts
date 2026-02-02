import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { 
  getStoredFlights, 
  storeFlights, 
  shouldFetchFromApi, 
  updateApiFetchLog,
  getStoredFlightCount 
} from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident');
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!ident) {
      return NextResponse.json(
        { error: 'Aircraft identifier (ident) is required' },
        { status: 400 }
      );
    }

    let flights: any[] = [];
    let fromCache = false;
    let newFlightsStored = 0;

    // Check if we should fetch from API (weekly - 7 days / 10080 minutes)
    // The cron job handles daily refreshes, so we use a longer cache to minimize costs
    const needsApiCall = forceRefresh || await shouldFetchFromApi(ident, 10080);

    if (!needsApiCall) {
      // Use stored flights from database
      console.log('Using stored flights from database...');
      flights = await getStoredFlights(ident, 200);
      fromCache = true;
      console.log(`Retrieved ${flights.length} stored flights`);
    } else {
      console.log('Fetching fresh data from FlightAware API...');
      
      try {
        // Fetch from FlightAware API (with pagination for up to 30 flights)
        // Reduced from 90 to minimize API costs (~2 API calls vs ~6)
        const apiFlights = await flightAware.getCurrentFlights(ident, 30);
        
        if (apiFlights.length > 0) {
          // Store the new flights in the database
          const { stored, errors } = await storeFlights(apiFlights);
          newFlightsStored = stored;
          console.log(`Stored ${stored} flights, ${errors} errors`);
          
          // Update fetch log
          await updateApiFetchLog(ident, apiFlights.length);
        }

        // Get all flights from database (includes historical + new)
        flights = await getStoredFlights(ident, 200);
        console.log(`Total flights in database: ${flights.length}`);
        
      } catch (apiError) {
        console.error('FlightAware API failed:', apiError);
        
        // Fall back to stored flights if API fails
        flights = await getStoredFlights(ident, 200);
        fromCache = true;
        
        if (flights.length === 0) {
          throw apiError; // Re-throw if we have nothing
        }
        
        console.log(`Using ${flights.length} stored flights due to API failure`);
      }
    }

    const storedCount = await getStoredFlightCount(ident);

    return NextResponse.json({
      ident,
      flights,
      count: flights.length,
      totalStored: storedCount,
      newFlightsStored,
      timestamp: new Date().toISOString(),
      fromCache,
      cacheInfo: fromCache 
        ? 'Data served from database to avoid API rate limits' 
        : `Fresh data merged with database (${newFlightsStored} new flights stored)`
    });
  } catch (error) {
    console.error('Error fetching current flights:', error);

    if (error instanceof FlightAwareError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          status: error.status,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
