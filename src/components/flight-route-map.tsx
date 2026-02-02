"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plane, Route } from "lucide-react";
import { useFlightData, FlightInfo } from '@/hooks/useFlightData';

// Fix Leaflet marker icons
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });

interface FlightRouteMapProps {
  ident: string;
  className?: string;
}

// Extended airport coordinates database
const AIRPORT_COORDINATES: Record<string, { latitude: number; longitude: number; name: string; city: string }> = {
  // New England
  'KPSM': { latitude: 43.0778, longitude: -70.8233, name: 'Portsmouth Intl', city: 'Portsmouth, NH' },
  'KBED': { latitude: 42.4700, longitude: -71.2889, name: 'Hanscom Field', city: 'Bedford, MA' },
  'KBGR': { latitude: 44.8073, longitude: -68.8281, name: 'Bangor Intl', city: 'Bangor, ME' },
  'KGHG': { latitude: 42.1056, longitude: -70.6719, name: 'Marshfield Muni', city: 'Marshfield, MA' },
  'KBTV': { latitude: 44.4719, longitude: -73.1533, name: 'Burlington Intl', city: 'Burlington, VT' },
  'KBOS': { latitude: 42.3656, longitude: -71.0096, name: 'Logan Intl', city: 'Boston, MA' },
  'KPWM': { latitude: 43.6462, longitude: -70.3093, name: 'Portland Intl Jetport', city: 'Portland, ME' },
  'KMHT': { latitude: 42.9326, longitude: -71.4357, name: 'Manchester-Boston', city: 'Manchester, NH' },
  'KPVC': { latitude: 42.0719, longitude: -70.2214, name: 'Provincetown Muni', city: 'Provincetown, MA' },
  'KMVY': { latitude: 41.3931, longitude: -70.6143, name: "Martha's Vineyard", city: "Martha's Vineyard, MA" },
  'KACK': { latitude: 41.2531, longitude: -70.0602, name: 'Nantucket Memorial', city: 'Nantucket, MA' },
  'KOWD': { latitude: 42.1903, longitude: -71.1737, name: 'Norwood Memorial', city: 'Norwood, MA' },
  'KEWB': { latitude: 41.6762, longitude: -70.9569, name: 'New Bedford Rgnl', city: 'New Bedford, MA' },

  // New York Area
  'KFRG': { latitude: 40.7289, longitude: -73.4133, name: 'Republic Airport', city: 'Farmingdale, NY' },
  'KJFK': { latitude: 40.6413, longitude: -73.7781, name: 'JFK Intl', city: 'New York, NY' },
  'KLGA': { latitude: 40.7769, longitude: -73.8740, name: 'LaGuardia', city: 'New York, NY' },
  'KEWR': { latitude: 40.6895, longitude: -74.1745, name: 'Newark Liberty', city: 'Newark, NJ' },
  'KTEB': { latitude: 40.8501, longitude: -74.0608, name: 'Teterboro', city: 'Teterboro, NJ' },
  'KHPN': { latitude: 41.0670, longitude: -73.7076, name: 'Westchester County', city: 'White Plains, NY' },

  // Mid-Atlantic
  'KPHL': { latitude: 39.8744, longitude: -75.2424, name: 'Philadelphia Intl', city: 'Philadelphia, PA' },
  'KIAD': { latitude: 38.9531, longitude: -77.4565, name: 'Dulles Intl', city: 'Washington, DC' },
  'KDCA': { latitude: 38.8512, longitude: -77.0402, name: 'Reagan National', city: 'Washington, DC' },
  'KBWI': { latitude: 39.1754, longitude: -76.6683, name: 'Baltimore/Washington', city: 'Baltimore, MD' },

  // Southeast
  'KFAY': { latitude: 35.0428, longitude: -78.8803, name: 'Fayetteville Rgnl', city: 'Fayetteville, NC' },
  'KTDF': { latitude: 36.2833, longitude: -78.9833, name: 'Person County', city: 'Roxboro, NC' },
  'KRDU': { latitude: 35.8801, longitude: -78.7870, name: 'Raleigh-Durham Intl', city: 'Raleigh, NC' },
  'KCLT': { latitude: 35.2140, longitude: -80.9431, name: 'Charlotte Douglas', city: 'Charlotte, NC' },
  'KATL': { latitude: 33.6407, longitude: -84.4277, name: 'Hartsfield-Jackson', city: 'Atlanta, GA' },
  'KMCO': { latitude: 28.4312, longitude: -81.3081, name: 'Orlando Intl', city: 'Orlando, FL' },
  'KMIA': { latitude: 25.7959, longitude: -80.2870, name: 'Miami Intl', city: 'Miami, FL' },
  'KTPA': { latitude: 27.9755, longitude: -82.5332, name: 'Tampa Intl', city: 'Tampa, FL' },
  'KPBI': { latitude: 26.6832, longitude: -80.0956, name: 'Palm Beach Intl', city: 'West Palm Beach, FL' },

  // Midwest
  'KORD': { latitude: 41.9742, longitude: -87.9073, name: "O'Hare Intl", city: 'Chicago, IL' },
  'KMDW': { latitude: 41.7868, longitude: -87.7522, name: 'Midway Intl', city: 'Chicago, IL' },
  'KDTW': { latitude: 42.2162, longitude: -83.3554, name: 'Detroit Metro', city: 'Detroit, MI' },
  'KCLE': { latitude: 41.4058, longitude: -81.8539, name: 'Cleveland Hopkins', city: 'Cleveland, OH' },
  'KCMH': { latitude: 39.9980, longitude: -82.8919, name: 'John Glenn Columbus', city: 'Columbus, OH' },
  'KPIT': { latitude: 40.4919, longitude: -80.2329, name: 'Pittsburgh Intl', city: 'Pittsburgh, PA' },
  'KMSP': { latitude: 44.8848, longitude: -93.2223, name: 'Minneapolis-St Paul', city: 'Minneapolis, MN' },
  'KSTL': { latitude: 38.7487, longitude: -90.3700, name: 'St. Louis Lambert', city: 'St. Louis, MO' },
  'KIND': { latitude: 39.7173, longitude: -86.2944, name: 'Indianapolis Intl', city: 'Indianapolis, IN' },

  // Southwest
  'KDFW': { latitude: 32.8998, longitude: -97.0403, name: 'Dallas/Fort Worth', city: 'Dallas, TX' },
  'KDAL': { latitude: 32.8471, longitude: -96.8518, name: 'Dallas Love Field', city: 'Dallas, TX' },
  'KHOU': { latitude: 29.6454, longitude: -95.2789, name: 'Houston Hobby', city: 'Houston, TX' },
  'KIAH': { latitude: 29.9902, longitude: -95.3368, name: 'Houston Bush', city: 'Houston, TX' },
  'KSAT': { latitude: 29.5337, longitude: -98.4698, name: 'San Antonio Intl', city: 'San Antonio, TX' },
  'KAUS': { latitude: 30.1975, longitude: -97.6664, name: 'Austin-Bergstrom', city: 'Austin, TX' },
  'KPHX': { latitude: 33.4373, longitude: -112.0078, name: 'Phoenix Sky Harbor', city: 'Phoenix, AZ' },
  'KLAS': { latitude: 36.0840, longitude: -115.1537, name: 'Harry Reid Intl', city: 'Las Vegas, NV' },
  'KABQ': { latitude: 35.0402, longitude: -106.6090, name: 'Albuquerque Intl', city: 'Albuquerque, NM' },
  'KDEN': { latitude: 39.8561, longitude: -104.6737, name: 'Denver Intl', city: 'Denver, CO' },

  // West Coast
  'KLAX': { latitude: 33.9416, longitude: -118.4085, name: 'Los Angeles Intl', city: 'Los Angeles, CA' },
  'KSFO': { latitude: 37.6213, longitude: -122.3790, name: 'San Francisco Intl', city: 'San Francisco, CA' },
  'KSAN': { latitude: 32.7336, longitude: -117.1897, name: 'San Diego Intl', city: 'San Diego, CA' },
  'KSEA': { latitude: 47.4502, longitude: -122.3088, name: 'Seattle-Tacoma', city: 'Seattle, WA' },
  'KPDX': { latitude: 45.5898, longitude: -122.5951, name: 'Portland Intl', city: 'Portland, OR' },
  'KOAK': { latitude: 37.7126, longitude: -122.2197, name: 'Oakland Intl', city: 'Oakland, CA' },
  'KSJC': { latitude: 37.3626, longitude: -121.9291, name: 'San Jose Intl', city: 'San Jose, CA' },
};

// Get airport coordinates - handles both ICAO and IATA codes
function getAirportCoordinates(code?: string): { latitude: number; longitude: number; name: string; city: string } | null {
  if (!code) return null;

  // Try direct lookup
  if (AIRPORT_COORDINATES[code]) {
    return AIRPORT_COORDINATES[code];
  }

  // Try with K prefix for US airports
  if (!code.startsWith('K') && AIRPORT_COORDINATES['K' + code]) {
    return AIRPORT_COORDINATES['K' + code];
  }

  return null;
}

interface RouteData {
  origin: { code: string; coords: { latitude: number; longitude: number; name: string; city: string } };
  destination: { code: string; coords: { latitude: number; longitude: number; name: string; city: string } };
  flight: FlightInfo;
  flightDate: Date;
  isRecent: boolean;
}

export function FlightRouteMap({ ident, className }: FlightRouteMapProps) {
  const { flights, isLoading } = useFlightData(ident);
  const [isClient, setIsClient] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation effect for recent flights
  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setAnimationProgress(prev => (prev + 0.5) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, [isClient]);

  // Process flight data
  const { routes, airports, stats } = useMemo(() => {
    const currentFlights = flights.data?.flights || [];

    // Debug: log what we're getting
    console.log('[FlightRouteMap] Total flights received:', currentFlights.length);
    if (currentFlights.length > 0) {
      console.log('[FlightRouteMap] Sample flight:', {
        origin: currentFlights[0]?.origin,
        destination: currentFlights[0]?.destination,
        actual_off: (currentFlights[0] as any)?.actual_off,
        actual_out: currentFlights[0]?.actual_out,
      });
    }

    // Filter to recent flights (last 12 months) to show meaningful data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentFlights = currentFlights.filter(flight => {
      const dateStr = flight.actual_out || flight.scheduled_out || (flight as any).actual_off || (flight as any).scheduled_off;
      if (!dateStr) return false;
      const flightDate = new Date(dateStr);
      return flightDate >= oneYearAgo;
    });

    console.log('[FlightRouteMap] Flights after date filter:', recentFlights.length);

    const routeMap = new Map<string, RouteData>();
    const airportMap = new Map<string, { code: string; coords: { latitude: number; longitude: number; name: string; city: string }; flightCount: number }>();
    let totalMiles = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let skippedNoCode = 0;
    let skippedNoCoords = 0;
    let skippedSameAirport = 0;
    const missingAirports = new Set<string>();

    recentFlights.forEach(flight => {
      const originCode = flight.origin?.code;
      const destCode = flight.destination?.code;

      if (!originCode || !destCode) {
        skippedNoCode++;
        return;
      }

      // Skip same airport flights (local flights)
      if (originCode === destCode) {
        skippedSameAirport++;
        return;
      }

      const originCoords = getAirportCoordinates(originCode);
      const destCoords = getAirportCoordinates(destCode);

      if (!originCoords) missingAirports.add(originCode);
      if (!destCoords) missingAirports.add(destCode);

      if (!originCoords || !destCoords) {
        skippedNoCoords++;
        return;
      }

      const dateStr = flight.actual_out || flight.scheduled_out || (flight as any).actual_off || (flight as any).scheduled_off;
      const flightDate = dateStr ? new Date(dateStr) : new Date();
      const isRecent = flightDate >= oneWeekAgo;

      // Create unique route key (sorted to combine A->B and B->A)
      const routeKey = [originCode, destCode].sort().join('-');

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          origin: { code: originCode, coords: originCoords },
          destination: { code: destCode, coords: destCoords },
          flight,
          flightDate,
          isRecent
        });
      } else if (isRecent) {
        // Update if this is more recent
        routeMap.set(routeKey, {
          ...routeMap.get(routeKey)!,
          isRecent: true,
          flightDate
        });
      }

      // Track airports
      [{ code: originCode, coords: originCoords }, { code: destCode, coords: destCoords }].forEach(airport => {
        const existing = airportMap.get(airport.code);
        if (existing) {
          existing.flightCount++;
        } else {
          airportMap.set(airport.code, { ...airport, flightCount: 1 });
        }
      });

      // Add to total miles
      if (flight.route_distance) {
        totalMiles += flight.route_distance;
      }
    });

    // Debug logging
    console.log('[FlightRouteMap] Processing results:', {
      totalFlights: recentFlights.length,
      skippedNoCode,
      skippedSameAirport,
      skippedNoCoords,
      routesFound: routeMap.size,
      airportsFound: airportMap.size,
      missingAirports: Array.from(missingAirports),
    });

    return {
      routes: Array.from(routeMap.values()).sort((a, b) => b.flightDate.getTime() - a.flightDate.getTime()),
      airports: Array.from(airportMap.values()),
      stats: {
        totalFlights: recentFlights.length,
        uniqueRoutes: routeMap.size,
        airportsVisited: airportMap.size,
        totalMiles: Math.round(totalMiles)
      }
    };
  }, [flights.data?.flights]);

  // Loading state
  if (!isClient) {
    return (
      <div className={className}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-robair-green" />
              <CardTitle className="text-xl">Flight Routes</CardTitle>
            </div>
            <CardDescription>Loading flight history...</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
              <div className="text-robair-black/50 flex items-center space-x-2">
                <Plane className="h-5 w-5 animate-pulse" />
                <span>Preparing map...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Center map on continental USA with slight east coast bias
  const mapCenter: [number, number] = [39.5, -98.0];
  const mapZoom = 4;

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-robair-green" />
              <CardTitle className="text-xl">Flight Routes</CardTitle>
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-robair-black/50">
                <div className="w-2 h-2 bg-robair-green rounded-full animate-pulse" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <CardDescription>
            Flight history for {ident} (last 12 months)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full h-96">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={false}
            >
              {/* Dark map style for better contrast */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {/* Flight route lines */}
              {routes.map((route, index) => {
                const positions: [[number, number], [number, number]] = [
                  [route.origin.coords.latitude, route.origin.coords.longitude],
                  [route.destination.coords.latitude, route.destination.coords.longitude]
                ];

                return (
                  <React.Fragment key={`route-${index}`}>
                    {/* Shadow/glow for recent routes */}
                    {route.isRecent && (
                      <Polyline
                        positions={positions}
                        color="#234D35"
                        weight={6}
                        opacity={0.2}
                      />
                    )}
                    {/* Main route line */}
                    <Polyline
                      positions={positions}
                      color={route.isRecent ? "#234D35" : "#234D35"}
                      weight={route.isRecent ? 3 : 2}
                      opacity={route.isRecent ? 0.9 : 0.5}
                      dashArray={route.isRecent ? undefined : "5,5"}
                    >
                      <Tooltip sticky>
                        <div className="text-sm">
                          <div className="font-semibold">{route.origin.code} to {route.destination.code}</div>
                          <div className="text-gray-600">{route.origin.coords.city}</div>
                          <div className="text-gray-600">to {route.destination.coords.city}</div>
                          {route.flight.route_distance && (
                            <div className="text-xs text-gray-500 mt-1">{route.flight.route_distance} nm</div>
                          )}
                        </div>
                      </Tooltip>
                    </Polyline>
                  </React.Fragment>
                );
              })}

              {/* Airport markers */}
              {airports.map((airport, index) => {
                const isHomeBase = airport.code === 'KPSM' || airport.code === 'KBED';
                const size = isHomeBase ? 10 : Math.min(4 + airport.flightCount, 8);

                return (
                  <CircleMarker
                    key={`airport-${index}`}
                    center={[airport.coords.latitude, airport.coords.longitude]}
                    radius={size}
                    fillColor={isHomeBase ? "#234D35" : "#234D35"}
                    fillOpacity={isHomeBase ? 1 : 0.7}
                    color="#ffffff"
                    weight={2}
                  >
                    <Tooltip>
                      <div className="text-sm">
                        <div className="font-semibold">{airport.code}</div>
                        <div>{airport.coords.name}</div>
                        <div className="text-gray-600">{airport.coords.city}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {airport.flightCount} flight{airport.flightCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Stats overlay */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-md z-[1000]">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between space-x-4">
                  <span className="text-robair-black/70">Flights</span>
                  <span className="font-semibold text-robair-black">{stats.totalFlights}</span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="text-robair-black/70">Routes</span>
                  <span className="font-semibold text-robair-black">{stats.uniqueRoutes}</span>
                </div>
                <div className="flex items-center justify-between space-x-4">
                  <span className="text-robair-black/70">Airports</span>
                  <span className="font-semibold text-robair-black">{stats.airportsVisited}</span>
                </div>
                {stats.totalMiles > 0 && (
                  <div className="flex items-center justify-between space-x-4 border-t pt-2">
                    <span className="text-robair-black/70">Total</span>
                    <span className="font-semibold text-robair-green">{stats.totalMiles.toLocaleString()} nm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md z-[1000]">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-0.5 bg-robair-green opacity-90"></div>
                  <span className="text-robair-black/70">Recent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-0.5 bg-robair-green opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #234D35 0, #234D35 3px, transparent 3px, transparent 6px)' }}></div>
                  <span className="text-robair-black/70">Earlier</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-robair-green rounded-full"></div>
                  <span className="text-robair-black/70">Airport</span>
                </div>
              </div>
            </div>

            {/* No data message */}
            {routes.length === 0 && !isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur flex items-center justify-center z-[1000]">
                <div className="text-center space-y-2">
                  <Plane className="h-8 w-8 text-robair-black/30 mx-auto" />
                  <div className="text-robair-black/70 text-sm font-medium">
                    No recent flights recorded
                  </div>
                  <div className="text-robair-black/50 text-xs">
                    Flight routes will appear here as data is collected
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-robair-light/50 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-robair-black/70">
                <MapPin className="h-4 w-4" />
                <span>
                  {stats.airportsVisited > 0
                    ? `${stats.airportsVisited} airports visited across ${stats.uniqueRoutes} unique routes`
                    : 'Map shows flight routes from recent history'
                  }
                </span>
              </div>
              {flights.data?.timestamp && (
                <span className="text-xs text-robair-black/50">
                  Updated: {new Date(flights.data.timestamp).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
