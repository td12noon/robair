"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, MapPin, Heart, TrendingUp } from "lucide-react";
import { useFlightData, type FlightInfo } from '@/hooks/useFlightData';

interface FlightAnalyticsProps {
  ident: string;
}

// Get flight distance from FlightAware data or fallback to 0
const getFlightDistance = (flight: FlightInfo): number => {
  // Use FlightAware route_distance if available (in nautical miles)
  if (flight.route_distance && flight.route_distance > 0) {
    return flight.route_distance;
  }

  // Return 0 if no distance data available
  return 0;
};

// Determine if a flight is an Angel Flight based on operator
const isAngelFlight = (operator?: string): boolean => {
  if (!operator) return false;

  // Check if the operator is "NGF" (New Generation Flight) or other Angel Flight identifiers
  return operator === 'NGF' ||
         operator.toLowerCase().includes('air charity network') ||
         operator.toLowerCase().includes('angel flight') ||
         operator === 'Air Charity Network';
};

const isCompletedFlight = (flight: FlightInfo): boolean => {
  return !flight.cancelled && flight.status !== "Cancelled";
};

// Get flight date as Date object
const getFlightDate = (flight: FlightInfo): Date | null => {
  const flightDateStr =
    flight.actual_off ?? flight.scheduled_off ?? flight.actual_out ?? flight.scheduled_out ?? "";
  if (!flightDateStr) return null;
  const date = new Date(flightDateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Format date for display (e.g., "Jan 2024")
const formatDateRange = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export function FlightAnalytics({ ident }: FlightAnalyticsProps) {
  const { flights } = useFlightData(ident);

  const currentFlights = flights.data?.flights || [];

  // Calculate all-time completed flights
  const completedFlights = currentFlights.filter((flight) => {
    return isCompletedFlight(flight);
  });

  // Calculate date range
  const { earliestDate, latestDate } = React.useMemo(() => {
    let earliest: Date | null = null;
    let latest: Date | null = null;

    completedFlights.forEach(flight => {
      const date = getFlightDate(flight);
      if (date) {
        if (!earliest || date < earliest) earliest = date;
        if (!latest || date > latest) latest = date;
      }
    });

    return { earliestDate: earliest, latestDate: latest };
  }, [completedFlights]);

  // Calculate total miles and Angel Flight miles
  let totalMiles = 0;
  let angelFlightMiles = 0;
  let angelFlightCount = 0;

  completedFlights.forEach(flight => {
    const distance = getFlightDistance(flight);
    totalMiles += distance;

    const angelFlight = isAngelFlight(flight.operator);

    if (angelFlight) {
      angelFlightMiles += distance;
      angelFlightCount += 1;
    }
  });

  const stats = [
    {
      title: "Total Flights",
      value: completedFlights.length.toLocaleString(),
      icon: Plane,
      description: "All-time flight activity",
      color: "text-robair-green",
    },
    {
      title: "Total Miles Flown",
      value: totalMiles.toLocaleString(),
      icon: MapPin,
      description: "All-time nautical miles",
      color: "text-blue-600",
    },
    {
      title: "Angel Flight Miles",
      value: angelFlightMiles.toLocaleString(),
      icon: Heart,
      description: `${angelFlightCount} Angel Flights`,
      color: "text-red-500",
    },
    {
      title: "Average Flight Distance",
      value: completedFlights.length > 0 ? Math.round(totalMiles / completedFlights.length).toLocaleString() : "0",
      icon: TrendingUp,
      description: "Nautical miles per flight",
      color: "text-purple-600",
    },
  ];

  // Date range string
  const dateRangeString = earliestDate && latestDate
    ? `Data from ${formatDateRange(earliestDate)} - ${formatDateRange(latestDate)}`
    : null;

  if (flights.error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-dashed border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="text-center text-amber-700">
                <div className="text-sm">Flight data unavailable</div>
                <div className="text-xs mt-1">Configure FlightAware API</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-robair-black/70">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-robair-black">{stat.value}</div>
                <p className="text-xs text-robair-black/50 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {dateRangeString && (
        <p className="text-center text-sm text-robair-black/60">{dateRangeString}</p>
      )}
    </div>
  );
}