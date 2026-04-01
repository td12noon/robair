"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, 
  Globe, 
  Fuel, 
  Plane, 
  Clock, 
  MapPin, 
  Heart, 
  TrendingUp,
  Calendar,
  Navigation,
  Award,
  Zap
} from "lucide-react";
import { useFlightData, type FlightInfo } from '@/hooks/useFlightData';
import { isAngelFlight } from '@/lib/angel-flight';

// Earth's circumference in nautical miles
const EARTH_CIRCUMFERENCE_NM = 21600;

// SR22 fuel burn rate (gallons per hour)
const SR22_FUEL_BURN_GPH = 17;

type YearFilter = 2025 | 2026 | "all-time";

type FlightForStats = FlightInfo & {
  actual_on?: string;
};

// Get flight time in hours from filed_ete (seconds)
const getFlightHours = (flight: FlightForStats): number => {
  if (flight.filed_ete && flight.filed_ete > 0) {
    return flight.filed_ete / 3600;
  }
  // Estimate from actual times if available
  if (flight.actual_off && flight.actual_on) {
    const off = new Date(flight.actual_off).getTime();
    const on = new Date(flight.actual_on).getTime();
    if (on > off) {
      return (on - off) / (1000 * 60 * 60);
    }
  }
  // Fallback: estimate from distance (assume 150 knot average)
  if (flight.route_distance) {
    return flight.route_distance / 150;
  }
  return 0;
};

const getFlightYear = (flight: FlightForStats): number | null => {
  const dateStr =
    flight.actual_off ?? flight.scheduled_off ?? flight.actual_out ?? flight.scheduled_out ?? '';
  const year = new Date(dateStr).getFullYear();
  return Number.isFinite(year) ? year : null;
};

const getYearLabel = (yearFilter: YearFilter): string => {
  return yearFilter === "all-time" ? "All-Time" : yearFilter.toString();
};

export default function StatsheetPage() {
  const ident = process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N424BB";
  const [yearFilter, setYearFilter] = useState<YearFilter>(2026);
  const { flights } = useFlightData(ident);
  const allFlights = (flights.data?.flights || []) as FlightForStats[];

  // Filter completed flights based on selected year
  const completedFlights = allFlights.filter((f) => {
    if (f.cancelled || f.status === 'Cancelled') return false;
    if (yearFilter === "all-time") return true;
    return getFlightYear(f) === yearFilter;
  });

  // Calculate all statistics
  const totalFlights = completedFlights.length;
  const totalMiles = completedFlights.reduce((sum, f) => sum + (f.route_distance || 0), 0);
  const totalHours = completedFlights.reduce((sum, f) => sum + getFlightHours(f), 0);
  const estimatedFuelGallons = totalHours * SR22_FUEL_BURN_GPH;
  const timesAroundGlobe = totalMiles / EARTH_CIRCUMFERENCE_NM;

  // Angel Flight stats
  const angelFlights = completedFlights.filter((f) =>
    isAngelFlight({ ident: f.ident, operator: f.operator })
  );
  const angelFlightMiles = angelFlights.reduce((sum, f) => sum + (f.route_distance || 0), 0);
  const angelFlightHours = angelFlights.reduce((sum, f) => sum + getFlightHours(f), 0);

  // Get unique airports
  const allAirports = new Set<string>();
  const airportVisits: Record<string, number> = {};
  
  completedFlights.forEach(flight => {
    const origin = flight.origin?.code;
    const dest = flight.destination?.code;
    
    if (origin) {
      allAirports.add(origin);
      airportVisits[origin] = (airportVisits[origin] || 0) + 1;
    }
    if (dest) {
      allAirports.add(dest);
      airportVisits[dest] = (airportVisits[dest] || 0) + 1;
    }
  });

  // Top 5 most visited airports
  const topAirports = Object.entries(airportVisits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Find longest and shortest flights
  const flightsWithDistance = completedFlights.filter(f => f.route_distance && f.route_distance > 0);
  const longestFlight = flightsWithDistance.reduce((max, f) => 
    (f.route_distance || 0) > (max?.route_distance || 0) ? f : max, flightsWithDistance[0]);
  const shortestFlight = flightsWithDistance.reduce((min, f) => 
    (f.route_distance || 0) < (min?.route_distance || Infinity) ? f : min, flightsWithDistance[0]);

  // Flights by year
  const flightsByYear: Record<number, number> = {};
  completedFlights.forEach(flight => {
    const dateStr = (flight as any).actual_off || (flight as any).scheduled_off || '';
    const year = new Date(dateStr).getFullYear();
    if (!isNaN(year) && year > 2000) {
      flightsByYear[year] = (flightsByYear[year] || 0) + 1;
    }
  });

  // Selected period stats (for progress section)
  const selectedPeriodMiles = completedFlights.reduce((sum, f) => sum + (f.route_distance || 0), 0);

  // Average flight stats
  const avgDistance = totalFlights > 0 ? totalMiles / totalFlights : 0;
  const avgDuration = totalFlights > 0 ? totalHours / totalFlights : 0;

  const yearLabel = getYearLabel(yearFilter);

  const heroStats = [
    {
      title: "Total Flights",
      value: totalFlights.toLocaleString(),
      icon: Plane,
      description: `${yearLabel} completed flights`,
      color: "bg-emerald-500",
    },
    {
      title: "Nautical Miles",
      value: totalMiles.toLocaleString(),
      icon: Navigation,
      description: `Total distance flown (${yearLabel})`,
      color: "bg-blue-500",
    },
    {
      title: "Times Around Earth",
      value: timesAroundGlobe.toFixed(2),
      icon: Globe,
      description: `${EARTH_CIRCUMFERENCE_NM.toLocaleString()} nm circumference`,
      color: "bg-purple-500",
    },
    {
      title: "Flight Hours",
      value: Math.round(totalHours).toLocaleString(),
      icon: Clock,
      description: `Estimated total time aloft (${yearLabel})`,
      color: "bg-amber-500",
    },
  ];

  const fuelStats = [
    {
      title: "Est. Fuel Used",
      value: `${Math.round(estimatedFuelGallons).toLocaleString()} gal`,
      icon: Fuel,
      description: `Based on ${SR22_FUEL_BURN_GPH} GPH burn rate`,
      color: "bg-orange-500",
    },
    {
      title: "Avg Flight Distance",
      value: `${Math.round(avgDistance).toLocaleString()} nm`,
      icon: TrendingUp,
      description: "Per flight average",
      color: "bg-cyan-500",
    },
    {
      title: "Avg Flight Duration",
      value: `${avgDuration.toFixed(1)} hrs`,
      icon: Zap,
      description: "Per flight average",
      color: "bg-pink-500",
    },
    {
      title: "Airports Visited",
      value: allAirports.size.toString(),
      icon: MapPin,
      description: "Unique airports",
      color: "bg-indigo-500",
    },
  ];

  if (flights.loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-robair-green">
              <BarChart3 className="h-6 w-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-robair-black">Statsheet</h1>
              <p className="text-robair-black/70">Loading flight statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-robair-green">
            <BarChart3 className="h-6 w-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-robair-black">Statsheet</h1>
            <p className="text-robair-black/70">
              Flight statistics for {ident}
            </p>
          </div>
        </div>

        {/* Year Toggle */}
        <div className="flex items-center justify-center gap-2">
          {([2025, 2026, "all-time"] as YearFilter[]).map((year) => (
            <button
              key={year}
              onClick={() => setYearFilter(year)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                yearFilter === year
                  ? "bg-robair-green text-white"
                  : "bg-robair-light text-robair-black/70 hover:bg-robair-light/80"
              }`}
            >
              {year === "all-time" ? "All-Time" : year}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {heroStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className={`h-1 ${stat.color}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-robair-black/70">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}/10`}>
                  <Icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-robair-black">{stat.value}</div>
                <p className="text-xs text-robair-black/50 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fuelStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-robair-black/70">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-robair-black">{stat.value}</div>
                <p className="text-xs text-robair-black/50 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Angel Flights & Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Angel Flight Stats */}
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle>Angel Flight Statistics</CardTitle>
                <CardDescription>Charitable medical transport flights</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{angelFlights.length}</div>
                <div className="text-sm text-robair-black/70">Angel Flights</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{angelFlightMiles.toLocaleString()}</div>
                <div className="text-sm text-robair-black/70">Miles Flown</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{Math.round(angelFlightHours)}</div>
                <div className="text-sm text-robair-black/70">Flight Hours</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {totalFlights > 0 ? ((angelFlights.length / totalFlights) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-robair-black/70">Of All Flights</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flight Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle>Flight Records</CardTitle>
                <CardDescription>Notable flights and achievements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {longestFlight && (
              <div className="p-4 bg-robair-light/50 rounded-lg">
                <div className="text-sm font-medium text-robair-black/70 mb-1">Longest Flight</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {longestFlight.origin?.code || '?'} → {longestFlight.destination?.code || '?'}
                  </span>
                  <span className="text-lg font-bold text-robair-green">
                    {longestFlight.route_distance?.toLocaleString()} nm
                  </span>
                </div>
              </div>
            )}
            {shortestFlight && (
              <div className="p-4 bg-robair-light/50 rounded-lg">
                <div className="text-sm font-medium text-robair-black/70 mb-1">Shortest Flight</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {shortestFlight.origin?.code || '?'} → {shortestFlight.destination?.code || '?'}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {shortestFlight.route_distance?.toLocaleString()} nm
                  </span>
                </div>
              </div>
            )}
            <div className="p-4 bg-robair-light/50 rounded-lg">
              <div className="text-sm font-medium text-robair-black/70 mb-1">{yearLabel} Progress</div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{completedFlights.length} flights</span>
                <span className="text-lg font-bold text-purple-600">
                  {selectedPeriodMiles.toLocaleString()} nm
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Airports & Yearly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Airports */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Most Visited Airports</CardTitle>
                <CardDescription>Your top destinations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAirports.map(([code, count], index) => (
                <div key={code} className="flex items-center justify-between p-3 bg-robair-light/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-robair-black/30'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-mono font-semibold">{code}</span>
                  </div>
                  <span className="text-robair-black/70">{count} visits</span>
                </div>
              ))}
              {topAirports.length === 0 && (
                <p className="text-center text-robair-black/50 py-4">No airport data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flights by Year */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Flights by Year</CardTitle>
                <CardDescription>Annual flight activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(flightsByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, count]) => {
                  const maxCount = Math.max(...Object.values(flightsByYear));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={year} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{year}</span>
                        <span className="text-robair-black/70">{count} flights</span>
                      </div>
                      <div className="h-2 bg-robair-light rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-robair-green rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(flightsByYear).length === 0 && (
                <p className="text-center text-robair-black/50 py-4">No yearly data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fun Facts */}
      <Card className="bg-gradient-to-br from-robair-light to-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-amber-500" />
            Fun Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                You've flown the equivalent of <span className="font-bold text-robair-green">{timesAroundGlobe.toFixed(2)}</span> trips around the Earth
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                That's roughly <span className="font-bold text-blue-600">{(totalMiles * 1.15078).toFixed(0).toLocaleString()}</span> statute miles
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                You've spent approximately <span className="font-bold text-purple-600">{Math.round(totalHours / 24)}</span> full days in the air
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                Average speed: <span className="font-bold text-cyan-600">{totalHours > 0 ? Math.round(totalMiles / totalHours) : 0}</span> knots ground speed
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                Est. CO₂ offset by Angel Flights: <span className="font-bold text-red-500">{Math.round(angelFlightHours * SR22_FUEL_BURN_GPH * 21.1)} lbs</span> for charity
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-robair-black/70">
                Distance to the Moon: <span className="font-bold text-indigo-600">{((totalMiles / 207559) * 100).toFixed(2)}%</span> of the way there
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

