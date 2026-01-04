"use client";

import React from "react";
import { useFlightData } from "@/hooks/useFlightData";

function getFlightYear(flight: any): number | null {
  const flightDateStr =
    (flight as any).actual_off ||
    (flight as any).scheduled_off ||
    (flight as any).actual_out ||
    (flight as any).scheduled_out ||
    "";
  const flightDate = new Date(flightDateStr);
  const year = flightDate.getFullYear();
  return Number.isFinite(year) ? year : null;
}

function isCompletedFlight(flight: any): boolean {
  return !flight.cancelled && flight.status !== "Cancelled";
}

export function AviationSummaryHeader({ ident, year = 2026 }: { ident: string; year?: number }) {
  const { flights } = useFlightData(ident);
  const allFlights = flights.data?.flights || [];

  const yearFlightsCount = React.useMemo(() => {
    return allFlights.filter((f) => isCompletedFlight(f) && getFlightYear(f) === year).length;
  }, [allFlights, year]);

  return (
    <div className="mt-2 space-y-1 text-robair-black/70">
      <p>{year} aviation summary</p>
      <p>that is {yearFlightsCount.toLocaleString()} flights</p>
    </div>
  );
}

