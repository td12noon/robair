import { NextRequest, NextResponse } from 'next/server';
import { flightAware, FlightAwareError } from '@/lib/flightaware';

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

    const position = await flightAware.getCurrentPosition(ident);

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