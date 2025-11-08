import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';
import { getCachedFlightData } from '@/lib/supabase';

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

    // For position data, we need very fresh data (5 minute cache max)
    let cachedData = await getCachedFlightData(ident, 5);
    let position = null;

    if (cachedData && cachedData.flights && cachedData.flights.length > 0) {
      // Get the most recent flight from cached data
      const recentFlight = cachedData.flights[0];
      if (recentFlight.status === 'En Route' || recentFlight.status === 'Active') {
        // Extract position from flight data if available
        position = {
          latitude: recentFlight.track?.latitude,
          longitude: recentFlight.track?.longitude,
          altitude: recentFlight.track?.altitude,
          heading: recentFlight.track?.heading,
          groundspeed: recentFlight.track?.groundspeed,
          timestamp: recentFlight.track?.timestamp,
          altitude_change: recentFlight.track?.altitude_change,
        };
      }
    }

    // If no cached position data, try FlightAware API
    if (!position) {
      try {
        position = await flightAware.getCurrentPosition(ident);
      } catch (error) {
        console.warn('FlightAware position API failed, using cached data fallback');
      }
    }

    if (!position) {
      return NextResponse.json({
        ident,
        position: null,
        status: 'No active flights found',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ident,
      position: {
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        heading: position.heading,
        groundspeed: position.groundspeed,
        timestamp: position.timestamp,
        altitude_change: position.altitude_change,
      },
      status: 'Active',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching aircraft position:', error);

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