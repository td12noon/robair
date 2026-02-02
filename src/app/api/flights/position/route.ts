import { NextRequest, NextResponse } from 'next/server';

/**
 * Position tracking endpoint - DISABLED to minimize FlightAware API costs.
 *
 * This endpoint previously made 7+ API calls per request (6 paginated flight
 * requests + 1 track request). With a 5-minute cache, this could result in
 * 2,000+ API calls per day.
 *
 * Real-time position tracking is not needed when the aircraft is on the ground.
 * The UI now estimates position from the most recent flight's destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ident = searchParams.get('ident');

  // Return null position without making any API calls
  // The UI handles this gracefully by showing estimated position from flight history
  return NextResponse.json({
    ident: ident || 'unknown',
    position: null,
    status: 'Position tracking disabled to reduce API costs',
    timestamp: new Date().toISOString(),
    apiCallsSaved: '7+ per request',
  });
}