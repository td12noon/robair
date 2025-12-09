import { NextRequest, NextResponse } from 'next/server';
import { getCachedFlightData } from '@/lib/supabase';

const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const ident = searchParams.get('ident') || process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || 'N424BB';
    const skipCache = searchParams.get('skipCache') === 'true';
    const testPagination = searchParams.get('testPagination') === 'true';

    const apiKey = process.env.FLIGHTAWARE_API_KEY;
    
    // Check API key
    const keyInfo = {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'N/A',
    };

    // Check cache first (unless skipping)
    let cachedData = null;
    let cacheInfo = { checked: false, found: false, flightsInCache: 0 };
    
    if (!skipCache) {
      cacheInfo.checked = true;
      cachedData = await getCachedFlightData(ident, 30);
      cacheInfo.found = !!cachedData;
      cacheInfo.flightsInCache = cachedData?.flights?.length || 0;
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
        flights: cachedData.flights?.slice(0, 10) || [],
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
        hint: 'Add ?skipCache=true to bypass cache. Add ?testPagination=true to test multi-page fetching.',
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

    // If testing pagination, make multiple requests
    if (testPagination) {
      return await testPaginatedFetch(ident, apiKey, keyInfo, cacheInfo, startTime);
    }

    // Single request for basic debug
    const url = `${FLIGHTAWARE_BASE_URL}/flights/${encodeURIComponent(ident)}`;

    const requestInfo = {
      url,
      method: 'GET',
      headers: {
        'x-apikey': `${apiKey.substring(0, 8)}...`,
        'Content-Type': 'application/json',
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
    const flightsSummary = flights.slice(0, 10).map((f: any) => ({
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

    // Check for pagination
    const hasNextPage = !!parsedResponse?.links?.next;
    const nextCursor = hasNextPage ? new URL(parsedResponse.links.next, FLIGHTAWARE_BASE_URL).searchParams.get('cursor') : null;

    return NextResponse.json({
      debug: true,
      source: 'api',
      success: response.ok,
      ident,
      keyInfo,
      cacheInfo,
      request: requestInfo,
      response: responseInfo,
      pagination: {
        flightsThisPage: flights.length,
        hasNextPage,
        nextCursor: nextCursor ? `${nextCursor.substring(0, 20)}...` : null,
        hint: hasNextPage ? 'More flights available. Add ?testPagination=true to fetch multiple pages.' : 'No more pages',
      },
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

async function testPaginatedFetch(
  ident: string, 
  apiKey: string, 
  keyInfo: any, 
  cacheInfo: any,
  startTime: number
) {
  const allFlights: any[] = [];
  const paginationLog: any[] = [];
  let cursor: string | undefined = undefined;
  const maxRequests = 6; // Up to 90 flights (6 pages * 15 per page)
  let requestCount = 0;

  try {
    while (requestCount < maxRequests) {
      requestCount++;
      
      // Build endpoint with cursor if we have one
      let url = `${FLIGHTAWARE_BASE_URL}/flights/${encodeURIComponent(ident)}`;
      if (cursor) {
        url += `?cursor=${encodeURIComponent(cursor)}`;
      }

      const requestStart = Date.now();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const requestTime = Date.now() - requestStart;
      const responseText = await response.text();
      let parsedResponse: any = null;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        paginationLog.push({
          request: requestCount,
          error: 'Failed to parse response',
          status: response.status,
          responseTime: requestTime,
        });
        break;
      }

      const flights = parsedResponse?.flights || [];
      
      paginationLog.push({
        request: requestCount,
        url: cursor ? `...?cursor=${cursor.substring(0, 15)}...` : url,
        status: response.status,
        flightsReturned: flights.length,
        totalSoFar: allFlights.length + flights.length,
        hasNextPage: !!parsedResponse?.links?.next,
        responseTime: requestTime,
      });

      if (flights.length === 0) {
        break;
      }

      allFlights.push(...flights);

      // Check if there's a next page
      if (parsedResponse?.links?.next) {
        const nextUrl = new URL(parsedResponse.links.next, FLIGHTAWARE_BASE_URL);
        cursor = nextUrl.searchParams.get('cursor') || undefined;
        
        if (!cursor) {
          break;
        }
      } else {
        break;
      }

      // Stop if we have enough flights
      if (allFlights.length >= 90) {
        break;
      }
    }

    const responseTime = Date.now() - startTime;

    // Summarize flights
    const flightsSummary = allFlights.slice(0, 15).map((f: any) => ({
      fa_flight_id: f.fa_flight_id,
      ident: f.ident,
      operator: f.operator,
      origin: f.origin?.code,
      destination: f.destination?.code,
      status: f.status,
      route_distance: f.route_distance,
      actual_off: f.actual_off,
    }));

    return NextResponse.json({
      debug: true,
      source: 'api-paginated',
      success: true,
      ident,
      keyInfo,
      cacheInfo,
      pagination: {
        totalRequests: requestCount,
        totalFlights: allFlights.length,
        log: paginationLog,
      },
      flightsCount: allFlights.length,
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
      paginationLog,
      flightsSoFar: allFlights.length,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
