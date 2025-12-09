import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { storeFlights, updateApiFetchLog, getStoredFlightCount } from '@/lib/supabase';

// Secret to protect the cron endpoint (set in Vercel env vars)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Daily cron job to refresh flight data
 * Called by Vercel Cron once per day
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured (for security)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ident = process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || 'N424BB';
    
    console.log(`[CRON] Daily flight refresh for: ${ident}`);
    console.log(`[CRON] Started at: ${new Date().toISOString()}`);

    // Fetch flights from FlightAware API (with pagination for up to 90 flights)
    const flights = await flightAware.getCurrentFlights(ident, 90);
    
    console.log(`[CRON] Fetched ${flights.length} flights from FlightAware`);

    if (flights.length === 0) {
      return NextResponse.json({
        success: true,
        ident,
        message: 'No new flights found',
        flightsFetched: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Store flights in database
    const { stored, errors } = await storeFlights(flights);
    console.log(`[CRON] Stored ${stored} flights, ${errors} errors`);

    // Update fetch log
    await updateApiFetchLog(ident, flights.length);

    const totalStored = await getStoredFlightCount(ident);

    return NextResponse.json({
      success: true,
      ident,
      flightsFetched: flights.length,
      flightsStored: stored,
      errors,
      totalInDatabase: totalStored,
      timestamp: new Date().toISOString(),
      message: `Daily refresh complete: ${stored} flights stored`,
    });

  } catch (error) {
    console.error('[CRON] Error in daily flight refresh:', error);

    if (error instanceof FlightAwareError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          status: error.status,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Manual refresh endpoint (for testing or manual triggers)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident') || process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || 'N424BB';

    console.log('Manual flight refresh for:', ident);

    // Fetch flights from FlightAware API
    const flights = await flightAware.getCurrentFlights(ident, 90);
    
    console.log(`Fetched ${flights.length} flights from FlightAware`);

    if (flights.length === 0) {
      return NextResponse.json({
        success: true,
        ident,
        message: 'No flights found',
        flightsFetched: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Store flights in database
    const { stored, errors } = await storeFlights(flights);
    console.log(`Stored ${stored} flights, ${errors} errors`);

    // Update fetch log
    await updateApiFetchLog(ident, flights.length);

    const totalStored = await getStoredFlightCount(ident);

    return NextResponse.json({
      success: true,
      ident,
      flightsFetched: flights.length,
      flightsStored: stored,
      errors,
      totalInDatabase: totalStored,
      timestamp: new Date().toISOString(),
      message: `Refresh complete: ${stored} flights stored`,
    });

  } catch (error) {
    console.error('Error refreshing flight data:', error);

    if (error instanceof FlightAwareError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          status: error.status,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
