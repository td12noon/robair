import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { getCachedFlightData, setCachedFlightData } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident');

    if (!ident) {
      return NextResponse.json(
        { error: 'Aircraft identifier (ident) is required' },
        { status: 400 }
      );
    }

    // Check cache first (30 minute expiration to avoid rate limits)
    console.log('Checking cache for flight data...');
    let cachedData = await getCachedFlightData(ident, 30);

    let flights: any[] = [];
    let fromCache = false;

    if (cachedData) {
      console.log('Using cached flight data');
      flights = cachedData.flights || [];
      fromCache = true;
    } else {
      console.log('Cache miss, fetching from FlightAware API...');
      try {
        // Use getCurrentFlights method which doesn't have date restrictions
        const flightsArray = await flightAware.getCurrentFlights(ident, 100);
        const response = { flights: flightsArray };
        flights = response.flights || [];

        // Cache the result
        const cacheData = {
          flights,
          timestamp: new Date().toISOString(),
          source: 'FlightAware API'
        };

        const cached = await setCachedFlightData(ident, cacheData);
        console.log('Cached flight data:', cached ? 'success' : 'failed');
      } catch (apiError) {
        // If API fails, try to get slightly older cached data (up to 2 hours)
        console.log('FlightAware API failed, checking for older cached data...');
        cachedData = await getCachedFlightData(ident, 120);

        if (cachedData) {
          console.log('Using older cached data due to API failure');
          flights = cachedData.flights || [];
          fromCache = true;
        } else {
          // Re-throw the error if no cache available
          throw apiError;
        }
      }
    }

    return NextResponse.json({
      ident,
      flights,
      count: flights.length,
      timestamp: new Date().toISOString(),
      fromCache,
      cacheInfo: fromCache ? 'Data served from cache to avoid API rate limits' : 'Fresh data from FlightAware API'
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