"use client";

import React, { useState, useEffect, useCallback } from 'react';

export interface FlightPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  groundspeed: number;
  timestamp: string;
  altitude_change: string;
}

export interface AircraftStatus {
  ident: string;
  position: FlightPosition | null;
  status: string;
  timestamp: string;
  error?: string;
  isEstimated?: boolean;
}

export interface FlightInfo {
  ident: string;
  fa_flight_id: string;
  status: string;
  operator?: string;
  route_distance?: number;
  origin?: {
    code?: string;
    name?: string;
  };
  destination?: {
    code?: string;
    name?: string;
  };
  scheduled_out?: string;
  actual_out?: string;
  estimated_in?: string;
  actual_in?: string;
  aircraft_type?: string;
  registration?: string;
}

export interface CurrentFlights {
  ident: string;
  flights: FlightInfo[];
  count: number;
  timestamp: string;
  error?: string;
}

export function useAircraftPosition(ident: string, refreshInterval = 30000) {
  const [data, setData] = useState<AircraftStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!ident) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flights/position?ident=${encodeURIComponent(ident)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch position';
      setError(errorMessage);
      console.error('Error fetching aircraft position:', err);
    } finally {
      setLoading(false);
    }
  }, [ident]);

  useEffect(() => {
    fetchPosition();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchPosition, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPosition, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchPosition,
  };
}

export function useCurrentFlights(ident: string, refreshInterval = 60000) {
  const [data, setData] = useState<CurrentFlights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlights = useCallback(async () => {
    if (!ident) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flights/current?ident=${encodeURIComponent(ident)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flights';
      setError(errorMessage);
      console.error('Error fetching current flights:', err);
    } finally {
      setLoading(false);
    }
  }, [ident]);

  useEffect(() => {
    fetchFlights();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchFlights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchFlights, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchFlights,
  };
}

// Helper function to get approximate coordinates for airport codes
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

export function useFlightData(ident: string) {
  const position = useAircraftPosition(ident);
  const flights = useCurrentFlights(ident);

  // If no live position, try to get last known location from recent flight
  const lastKnownLocation = React.useMemo(() => {
    if (position.data?.position) return null; // We have live data

    const recentFlights = flights.data?.flights || [];
    const mostRecentFlight = recentFlights[0]; // Already sorted by most recent

    if (mostRecentFlight?.status === 'Arrived' && mostRecentFlight.destination) {
      const coords = getAirportCoordinates(mostRecentFlight.destination.code);
      if (coords) {
        return {
          position: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: 0,
            heading: 0,
            groundspeed: 0,
            timestamp: mostRecentFlight.actual_in || mostRecentFlight.estimated_in || '',
            altitude_change: '' as const,
          },
          status: `On Ground at ${coords.name}`,
          ident,
          timestamp: new Date().toISOString(),
          isEstimated: true,
        };
      }
    }

    return null;
  }, [position.data?.position, flights.data?.flights, ident]);

  return {
    position: {
      ...position,
      data: position.data || lastKnownLocation,
    },
    flights,
    isLoading: position.loading || flights.loading,
    hasError: !!position.error || !!flights.error,
    refresh: () => {
      position.refresh();
      flights.refresh();
    },
  };
}