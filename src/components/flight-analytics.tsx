"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, MapPin, Heart, TrendingUp } from "lucide-react";
import { useFlightData } from '@/hooks/useFlightData';

interface FlightAnalyticsProps {
  ident: string;
}

// Airport distances (approximate great circle distances in nautical miles)
const getFlightDistance = (originCode?: string, destinationCode?: string): number => {
  if (!originCode || !destinationCode) return 0;

  // Common routes and their approximate distances in nautical miles
  const routeDistances: Record<string, number> = {
    // New England regional routes
    'KPSM-KBED': 45,
    'KBED-KPSM': 45,
    'KPSM-KBGR': 150,
    'KBGR-KPSM': 150,
    'KBED-KFRG': 180,
    'KFRG-KBED': 180,
    'KPSM-KGHG': 35,
    'KGHG-KPSM': 35,
    'KBED-KBTV': 180,
    'KBTV-KBED': 180,

    // Angel Flight routes (typically longer distances)
    'KPSM-KFAY': 520,
    'KFAY-KPSM': 520,
    'KBED-KFAY': 540,
    'KFAY-KBED': 540,
    'KPSM-KTDF': 480,
    'KTDF-KPSM': 480,
    'KBED-KTDF': 500,
    'KTDF-KBED': 500,
  };

  const routeKey = `${originCode}-${destinationCode}`;
  return routeDistances[routeKey] || 200; // Default fallback distance
};

// Determine if a flight is likely an Angel Flight based on destination
const isAngelFlight = (originCode?: string, destinationCode?: string): boolean => {
  if (!originCode || !destinationCode) return false;

  // Angel Flights are typically longer routes to medical facilities
  // Common Angel Flight destinations from New England
  const angelFlightAirports = ['KFAY', 'KTDF']; // Fayetteville, Person County
  const newEnglandAirports = ['KPSM', 'KBED', 'KBGR', 'KGHG', 'KBTV'];

  // Check if it's a route between New England and known Angel Flight destinations
  const isFromNE = newEnglandAirports.includes(originCode);
  const isToAngel = angelFlightAirports.includes(destinationCode);
  const isFromAngel = angelFlightAirports.includes(originCode);
  const isToNE = newEnglandAirports.includes(destinationCode);

  return (isFromNE && isToAngel) || (isFromAngel && isToNE);
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
    const distance = getFlightDistance(flight.origin?.code, flight.destination?.code);
    totalMiles += distance;

    if (isAngelFlight(flight.origin?.code, flight.destination?.code)) {
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