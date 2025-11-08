"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFlightData } from '@/hooks/useFlightData';

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
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

interface FlightMapProps {
  ident: string;
  height?: string;
}

// Airport coordinates from the useFlightData hook
const getAirportCoordinates = (airportCode?: string) => {
  const airports: Record<string, { latitude: number; longitude: number; name: string }> = {
    'KPSM': { latitude: 43.0778, longitude: -70.8233, name: 'Portsmouth International' },
    'KBED': { latitude: 42.4700, longitude: -71.2889, name: 'Laurence G Hanscom Field' },
    'KBGR': { latitude: 44.8073, longitude: -68.8281, name: 'Bangor International' },
    'KFRG': { latitude: 40.7289, longitude: -73.4133, name: 'Republic Airport' },
    'KGHG': { latitude: 42.1056, longitude: -70.6719, name: 'Marshfield Municipal' },
    'KBTV': { latitude: 44.4719, longitude: -73.1533, name: 'Burlington International' },
    'KFAY': { latitude: 35.0428, longitude: -78.8803, name: 'Fayetteville Regional' },
    'KTDF': { latitude: 36.2833, longitude: -78.9833, name: 'Person County' },
  };

  return airportCode ? airports[airportCode] : null;
};

export function FlightMap({ ident, height = "400px" }: FlightMapProps) {
  const { position, flights } = useFlightData(ident);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server side
  if (!isClient) {
    return (
      <div
        className="bg-robair-light rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-robair-black/70">Loading map...</div>
      </div>
    );
  }

  const currentPosition = position.data?.position;
  const currentFlights = flights.data?.flights || [];

  // Get map center - use current position or default to New England area
  let mapCenter: [number, number] = [42.9, -71.5]; // Default New England center
  if (currentPosition) {
    mapCenter = [currentPosition.latitude, currentPosition.longitude];
  } else if (currentFlights.length > 0) {
    // Use most recent flight's destination
    const recentFlight = currentFlights[0];
    const destCoords = getAirportCoordinates(recentFlight.destination?.code);
    if (destCoords) {
      mapCenter = [destCoords.latitude, destCoords.longitude];
    }
  }

  // Create flight paths from recent flights
  const flightPaths = currentFlights.slice(0, 5).map(flight => {
    const origin = getAirportCoordinates(flight.origin?.code);
    const destination = getAirportCoordinates(flight.destination?.code);

    if (origin && destination) {
      return {
        path: [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]] as [[number, number], [number, number]],
        flight: flight,
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-robair-black/10">
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current aircraft position */}
        {currentPosition && (
          <Marker position={[currentPosition.latitude, currentPosition.longitude]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{ident}</div>
                <div>Altitude: {currentPosition.altitude.toLocaleString()} ft</div>
                <div>Speed: {currentPosition.groundspeed} kts</div>
                <div>Heading: {currentPosition.heading}°</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(currentPosition.timestamp).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Airport markers for recent flights */}
        {currentFlights.slice(0, 5).flatMap(flight => {
          const origin = getAirportCoordinates(flight.origin?.code);
          const destination = getAirportCoordinates(flight.destination?.code);

          return [origin, destination].filter(Boolean).map((airport, index) =>
            airport && (
              <Marker
                key={`${flight.fa_flight_id}-${index}`}
                position={[airport.latitude, airport.longitude]}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{airport.name}</div>
                    <div>{flight.origin?.code === getAirportCodeFromCoords(airport) ? 'Origin' : 'Destination'}</div>
                    <div className="text-xs text-gray-500">
                      Flight: {flight.ident}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          );
        }).filter(Boolean)}

        {/* Flight paths */}
        {flightPaths.map((pathData, index) =>
          pathData && (
            <Polyline
              key={`path-${index}`}
              positions={pathData.path}
              color="#234D35"
              weight={2}
              opacity={0.7}
            />
          )
        )}
      </MapContainer>
    </div>
  );
}

// Helper function to get airport code from coordinates
function getAirportCodeFromCoords(coords: { latitude: number; longitude: number }) {
  const airports = {
    'KPSM': { latitude: 43.0778, longitude: -70.8233 },
    'KBED': { latitude: 42.4700, longitude: -71.2889 },
    'KBGR': { latitude: 44.8073, longitude: -68.8281 },
    'KFRG': { latitude: 40.7289, longitude: -73.4133 },
    'KGHG': { latitude: 42.1056, longitude: -70.6719 },
    'KBTV': { latitude: 44.4719, longitude: -73.1533 },
    'KFAY': { latitude: 35.0428, longitude: -78.8803 },
    'KTDF': { latitude: 36.2833, longitude: -78.9833 },
  };

  for (const [code, airport] of Object.entries(airports)) {
    if (Math.abs(airport.latitude - coords.latitude) < 0.01 &&
        Math.abs(airport.longitude - coords.longitude) < 0.01) {
      return code;
    }
  }
  return '';
}