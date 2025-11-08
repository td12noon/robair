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

    // Get flights with extended date range to capture more flight history
    const endDate = new Date();
    const startDate = new Date('2024-01-01'); // Start from beginning of 2024

    // Use getFlightByIdent directly with date range and max_pages
    const response = await flightAware.getFlightByIdent(ident, startDate, endDate, 100);
    const flights = response.flights || [];

    return NextResponse.json({
      ident,
      flights,
      count: flights.length,
      timestamp: new Date().toISOString(),
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