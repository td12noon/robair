"use client";

import React from "react";
import { useFlightData, type FlightInfo } from "@/hooks/useFlightData";

function getFlightYear(flight: FlightInfo): number | null {
  const flightDateStr =
    flight.actual_off ?? flight.scheduled_off ?? flight.actual_out ?? flight.scheduled_out ?? "";
  const year = new Date(flightDateStr).getFullYear();
  return Number.isFinite(year) ? year : null;
}

function isCompletedFlight(flight: FlightInfo): boolean {
  return !flight.cancelled && flight.status !== "Cancelled";
}

export function AviationSummaryHeader({ ident, year = 2026 }: { ident: string; year?: number }) {
  const { flights } = useFlightData(ident);
  const yearFlightsCount = React.useMemo(() => {
    const allFlights = flights.data?.flights ?? [];
    return allFlights.filter((f) => isCompletedFlight(f) && getFlightYear(f) === year).length;
  }, [flights.data?.flights, year]);

  return (
    <div className="mt-2 space-y-1 text-robair-black/70">
      <p>{year} aviation summary</p>
      <p>that is {yearFlightsCount.toLocaleString()} flights</p>
    </div>
  );
}

