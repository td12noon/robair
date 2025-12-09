import { NextRequest, NextResponse } from 'next/server';
import { getCachedFlightData } from '@/lib/supabase';

const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident') || process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || 'N424BB';
    const skipCache = searchParams.get('skipCache') === 'true';

    const apiKey = process.env.FLIGHTAWARE_API_KEY;
    
    // Check API key
    const keyInfo = {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'N/A',
    };

    // Check cache first (unless skipping)
    let cachedData = null;
    let cacheInfo = { checked: false, found: false, age: null as number | null };
    
    if (!skipCache) {
      cacheInfo.checked = true;
      cachedData = await getCachedFlightData(ident, 30);
      cacheInfo.found = !!cachedData;
    }

    if (cachedData && !skipCache) {
      const responseTime = Date.now() - startTime;
      return NextResponse.json({
        debug: true,
        source: 'cache',
        ident,
        keyInfo,
        cacheInfo,
        flightsCount: cachedData.flights?.length || 0,
        flights: cachedData.flights?.slice(0, 5) || [],
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
        hint: 'Add ?skipCache=true to bypass cache and hit FlightAware API directly',
      });
    }

    if (!apiKey) {
      return NextResponse.json({
        debug: true,
        error: 'FLIGHTAWARE_API_KEY not configured',
        keyInfo,
        cacheInfo,
        timestamp: new Date().toISOString(),
      });
    }

    // Build request - no date params to avoid format issues
    const params = new URLSearchParams();
    params.append('max_pages', '100');

    const url = `${FLIGHTAWARE_BASE_URL}/flights/${encodeURIComponent(ident)}?${params.toString()}`;

    const requestInfo = {
      url,
      method: 'GET',
      headers: {
        'x-apikey': `${apiKey.substring(0, 8)}...`,
        'Content-Type': 'application/json',
      },
      params: {
        ident,
        max_pages: 100,
      },
    };

    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    // Get raw response
    const rawResponseText = await response.text();
    let parsedResponse: any = null;
    let parseError: string | null = null;

    try {
      parsedResponse = JSON.parse(rawResponseText);
    } catch (e) {
      parseError = `Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      rawBodyPreview: rawResponseText.substring(0, 1000),
      rawBodyLength: rawResponseText.length,
      parseError,
    };

    // Extract flight info
    const flights = parsedResponse?.flights || [];
    const flightsSummary = flights.slice(0, 5).map((f: any) => ({
      fa_flight_id: f.fa_flight_id,
      ident: f.ident,
      operator: f.operator,
      origin: f.origin?.code,
      destination: f.destination?.code,
      status: f.status,
      route_distance: f.route_distance,
      actual_off: f.actual_off,
      scheduled_off: f.scheduled_off,
    }));

    return NextResponse.json({
      debug: true,
      source: 'api',
      success: response.ok,
      ident,
      keyInfo,
      cacheInfo,
      request: requestInfo,
      response: responseInfo,
      flightsCount: flights.length,
      numPages: parsedResponse?.num_pages,
      flights: flightsSummary,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      debug: true,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
