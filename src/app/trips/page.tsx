"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Clock, Navigation, Fuel, Gauge, RefreshCw, ExternalLink, Heart } from "lucide-react";
import { AircraftMap } from "@/components/aircraft-map";
import { useFlightData } from "@/hooks/useFlightData";

const AIRCRAFT_IDENT = process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N12345";

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeOnly(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Check if flight is Angel Flight based on operator
function isAngelFlight(operator?: string): boolean {
  if (!operator) return false;
  return operator === 'NGF' ||
         operator.toLowerCase().includes('air charity network') ||
         operator.toLowerCase().includes('angel flight') ||
         operator === 'Air Charity Network';
}

export default function TripsPage() {
  const { position, flights, isLoading, hasError, refresh } = useFlightData(AIRCRAFT_IDENT);
  const [sortBy, setSortBy] = React.useState<'date' | 'route'>('date');

  const currentFlights = flights.data?.flights || [];
  const activeFlights = currentFlights.filter(flight =>
    flight.status === 'En Route' || flight.status === 'Active' || flight.status === 'Scheduled'
  );
  const hasActiveFlights = activeFlights.length > 0;

  // Sort flights by date (most recent first) or by route
  const sortedFlights = React.useMemo(() => {
    const flightsCopy = [...currentFlights];

    if (sortBy === 'date') {
      return flightsCopy.sort((a, b) => {
        const dateA = new Date((a as any).actual_off || (a as any).scheduled_off || a.actual_out || a.scheduled_out || '');
        const dateB = new Date((b as any).actual_off || (b as any).scheduled_off || b.actual_out || b.scheduled_out || '');
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
    } else {
      return flightsCopy.sort((a, b) => {
        const routeA = `${a.origin?.code || ''}-${a.destination?.code || ''}`;
        const routeB = `${b.origin?.code || ''}-${b.destination?.code || ''}`;
        return routeA.localeCompare(routeB);
      });
    }
  }, [currentFlights, sortBy]);
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-robair-black">Flight Tracking</h1>
          <p className="text-robair-black/70 mt-2">
            Real-time flight information for {AIRCRAFT_IDENT} powered by FlightAware
          </p>
        </div>
        <Button onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Updating...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Current Flight Status */}
      <Card className="bg-gradient-to-r from-robair-green/5 to-robair-green/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Navigation className="mr-2 h-6 w-6" />
            Current Flight Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActiveFlights ? (
            <div className="space-y-4">
              {activeFlights.map((flight) => (
                <div key={flight.fa_flight_id} className="bg-white/60 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-robair-green">
                        <Plane className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-robair-black">
                          {flight.ident} - {flight.status}
                        </h3>
                        <p className="text-robair-black/70">
                          {flight.origin?.code} → {flight.destination?.code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-robair-black/70">
                        {flight.aircraft_type && `Aircraft: ${flight.aircraft_type}`}
                      </div>
                      {flight.scheduled_out && (
                        <div className="text-sm text-robair-black/70">
                          Departure: {formatDateTime(flight.scheduled_out)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl">🛬</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-robair-black">Aircraft On Ground</h3>
                <p className="text-robair-black/70">
                  {hasError ? 'Unable to fetch flight data' : 'No active flights detected'}
                </p>
                {flights.error && (
                  <p className="text-sm text-red-600">{flights.error}</p>
                )}
              </div>
              <Button variant="outline" onClick={refresh} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aircraft Map */}
      <AircraftMap ident={AIRCRAFT_IDENT} />

      {/* Flight Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-robair-green" />
              <CardTitle>Current Position</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">Coordinates</p>
              {position.data?.position ? (
                <div className="text-sm text-robair-black/70 space-y-1">
                  <div>Lat: {position.data.position.latitude.toFixed(6)}°</div>
                  <div>Lng: {position.data.position.longitude.toFixed(6)}°</div>
                  <div className="text-xs text-robair-black/50">
                    Updated: {new Date(position.data.position.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-robair-black/70">
                  {position.error ? 'Position unavailable' : 'Aircraft on ground'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Gauge className="h-5 w-5 text-robair-green" />
              <CardTitle>Altitude & Speed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {position.data?.position ? (
                <div className="text-sm text-robair-black/70 space-y-1">
                  <div><strong>Alt:</strong> {position.data.position.altitude.toLocaleString()} ft MSL</div>
                  <div><strong>Speed:</strong> {position.data.position.groundspeed} kts</div>
                  <div><strong>Heading:</strong> {position.data.position.heading}°</div>
                  <div className="text-xs">
                    <strong>Trend:</strong> {position.data.position.altitude_change || 'Level'}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-robair-black/70">Data available during flight</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-robair-green" />
              <CardTitle>Flight Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">Recent Activity</p>
              <div className="text-sm text-robair-black/70 space-y-1">
                <div>Total flights today: {currentFlights.length}</div>
                <div>Active flights: {activeFlights.length}</div>
                {flights.data?.timestamp && (
                  <div className="text-xs text-robair-black/50">
                    Last check: {new Date(flights.data.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Flights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Flight History</CardTitle>
              <CardDescription>
                {currentFlights.length} recent flights for {AIRCRAFT_IDENT}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-robair-black/70">Sort by:</span>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                Date
              </Button>
              <Button
                variant={sortBy === 'route' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('route')}
              >
                Route
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedFlights.length > 0 ? (
            <div className="space-y-4">
              {sortedFlights.map((flight) => (
                <div
                  key={flight.fa_flight_id}
                  className="flex items-center justify-between p-4 bg-robair-light/50 rounded-lg hover:bg-robair-light/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      activeFlights.some(f => f.fa_flight_id === flight.fa_flight_id)
                        ? 'bg-green-500'
                        : isAngelFlight(flight.operator)
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}>
                      {isAngelFlight(flight.operator) ? (
                        <Heart className="h-5 w-5 text-white" />
                      ) : (
                        <Plane className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-robair-black">
                        {flight.ident}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-robair-black/70">
                        {flight.origin?.code && flight.destination?.code ? (
                          <>
                            <span>{flight.origin.name || flight.origin.code}</span>
                            <span>→</span>
                            <span>{flight.destination.name || flight.destination.code}</span>
                          </>
                        ) : (
                          <span>Local Flight</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-robair-black">
                      {flight.status}
                    </div>

                    {/* Flight Date - Prominent Display */}
                    {((flight as any).actual_off || (flight as any).scheduled_off || flight.actual_out || flight.scheduled_out) && (
                      <div className="text-sm font-medium text-robair-green mt-1">
                        {formatDate((flight as any).actual_off || (flight as any).scheduled_off || flight.actual_out || flight.scheduled_out!)}
                      </div>
                    )}

                    {/* Flight Time */}
                    {((flight as any).actual_off || (flight as any).scheduled_off || flight.actual_out || flight.scheduled_out) && (
                      <div className="text-xs text-robair-black/70">
                        Departed: {formatTimeOnly((flight as any).actual_off || (flight as any).scheduled_off || flight.actual_out || flight.scheduled_out!)}
                      </div>
                    )}

                    {/* Aircraft Info */}
                    <div className="text-xs text-robair-black/50 mt-1">
                      {flight.aircraft_type && flight.aircraft_type}
                      {flight.registration && ` • ${flight.registration}`}
                      {flight.operator && ` • ${flight.operator}`}
                      {flight.route_distance && ` • ${flight.route_distance} nm`}
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-center pt-4">
                <Button variant="outline" onClick={refresh} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Load More Flights
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Plane className="h-12 w-12 mx-auto text-robair-black/30" />
              <div>
                <h3 className="text-lg font-semibold text-robair-black">
                  {hasError ? 'Unable to Load Flight Data' : 'No Recent Flights'}
                </h3>
                <p className="text-robair-black/70 mt-2">
                  {hasError
                    ? 'Check your FlightAware API configuration and try again.'
                    : 'Flight data will appear here when your aircraft is active.'
                  }
                </p>
                {hasError && flights.error && (
                  <p className="text-sm text-red-600 mt-1">{flights.error}</p>
                )}
              </div>
              <Button variant="outline" onClick={refresh} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {hasError ? 'Retry' : 'Refresh Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {hasError && (
        <Card className="border-dashed border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <Fuel className="mr-2 h-5 w-5" />
              FlightAware API Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-700">
                To enable real-time flight tracking, configure your FlightAware API:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                <li>Sign up for FlightAware AeroAPI at <code className="text-xs bg-amber-100 px-1 rounded">flightaware.com/commercial/aeroapi/</code></li>
                <li>Get your API key from the FlightAware dashboard</li>
                <li>Add <code className="text-xs bg-amber-100 px-1 rounded">FLIGHTAWARE_API_KEY=your_key_here</code> to your .env.local file</li>
                <li>Update <code className="text-xs bg-amber-100 px-1 rounded">NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER</code> with your aircraft's tail number</li>
                <li>Restart the application to load the new configuration</li>
              </ol>
              <Button variant="outline" onClick={refresh} disabled={isLoading} className="mt-4">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}