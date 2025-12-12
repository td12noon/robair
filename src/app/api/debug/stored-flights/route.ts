import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const ident = searchParams.get('ident') || null;

    if (!supabase) {
      return NextResponse.json({
        debug: true,
        success: false,
        error: 'Supabase not configured',
        timestamp: new Date().toISOString(),
      });
    }

    // Build the query
    let query = supabase
      .from('flights')
      .select('id, ident, fa_flight_id, operator, origin_code, destination_code, status, route_distance, aircraft_type, flight_date, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by ident if provided
    if (ident) {
      query = query.eq('ident', ident);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({
        debug: true,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // Get total count
    let countQuery = supabase
      .from('flights')
      .select('*', { count: 'exact', head: true });

    if (ident) {
      countQuery = countQuery.eq('ident', ident);
    }

    const { count } = await countQuery;

    // Get unique identifiers
    const uniqueIdents = [...new Set((data || []).map(f => f.ident))];

    // Get stats per ident
    const identStats: Record<string, { count: number; earliest: string | null; latest: string | null }> = {};
    for (const flight of data || []) {
      if (!identStats[flight.ident]) {
        identStats[flight.ident] = { count: 0, earliest: null, latest: null };
      }
      identStats[flight.ident].count++;
      
      const createdAt = flight.created_at;
      if (createdAt) {
        if (!identStats[flight.ident].earliest || createdAt < identStats[flight.ident].earliest!) {
          identStats[flight.ident].earliest = createdAt;
        }
        if (!identStats[flight.ident].latest || createdAt > identStats[flight.ident].latest!) {
          identStats[flight.ident].latest = createdAt;
        }
      }
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      debug: true,
      success: true,
      totalCount: count,
      returnedCount: data?.length || 0,
      uniqueIdents,
      identStats,
      flights: data || [],
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      debug: true,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
