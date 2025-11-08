"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, MapPin, Heart, TrendingUp } from "lucide-react";
import { useFlightData } from '@/hooks/useFlightData';

interface FlightAnalyticsProps {
  ident: string;
}

// Get flight distance from FlightAware data or fallback to 0
const getFlightDistance = (flight: any): number => {
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

  // Check if the operator is "Air Charity Network"
  return operator.toLowerCase().includes('air charity network') ||
         operator.toLowerCase().includes('angel flight') ||
         operator === 'Air Charity Network';
};

export function FlightAnalytics({ ident }: FlightAnalyticsProps) {
  const { flights } = useFlightData(ident);

  const currentFlights = flights.data?.flights || [];

  // Calculate this year's flights (calendar year)
  const currentYear = new Date().getFullYear();
  const thisYearFlights = currentFlights.filter(flight => {
    const flightDate = new Date(flight.actual_out || flight.scheduled_out || '');
    return flightDate.getFullYear() === currentYear;
  });

  // Calculate total miles and Angel Flight miles
  let totalMiles = 0;
  let angelFlightMiles = 0;
  let angelFlightCount = 0;

  thisYearFlights.forEach(flight => {
    const distance = getFlightDistance(flight);
    totalMiles += distance;

    if (isAngelFlight(flight.operator)) {
      angelFlightMiles += distance;
      angelFlightCount += 1;
    }
  });

  const stats = [
    {
      title: "Flights This Year",
      value: thisYearFlights.length.toLocaleString(),
      icon: Plane,
      description: `${currentYear} flight activity`,
      color: "text-robair-green",
    },
    {
      title: "Total Miles Flown",
      value: totalMiles.toLocaleString(),
      icon: MapPin,
      description: "Nautical miles this year",
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
      value: thisYearFlights.length > 0 ? Math.round(totalMiles / thisYearFlights.length).toLocaleString() : "0",
      icon: TrendingUp,
      description: "Nautical miles per flight",
      color: "text-purple-600",
    },
  ];

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
  );
}