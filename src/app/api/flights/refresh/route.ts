import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { setCachedFlightData, clearOldCache } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident');

    if (!ident) {
      return NextResponse.json(
        { error: 'Aircraft identifier (ident) is required' },
        { status: 400 }
      );
    }

    console.log('Force refreshing flight data for:', ident);

    // Get fresh data from FlightAware
    const endDate = new Date();
    const startDate = new Date('2024-01-01');
    const response = await flightAware.getFlightByIdent(ident, startDate, endDate, 100);
    const flights = response.flights || [];

    // Cache the fresh data
    const cacheData = {
      flights,
      timestamp: new Date().toISOString(),
      source: 'FlightAware API (force refresh)'
    };

    const cached = await setCachedFlightData(ident, cacheData);
    console.log('Force cached flight data:', cached ? 'success' : 'failed');

    // Clean up old cache entries
    await clearOldCache(24);

    return NextResponse.json({
      ident,
      flights,
      count: flights.length,
      timestamp: new Date().toISOString(),
      refreshed: true,
      cached: cached,
      message: 'Flight data refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing flight data:', error);

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