"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plane, RefreshCw, AlertCircle } from "lucide-react";
import { useAircraftPosition } from "@/hooks/useFlightData";

interface AircraftMapProps {
  ident: string;
  className?: string;
}

function formatCoordinates(lat: number, lng: number) {
  const formatDegrees = (coord: number, isLat: boolean) => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.floor(((abs - degrees) * 60 - minutes) * 60);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return {
    latitude: formatDegrees(lat, true),
    longitude: formatDegrees(lng, false),
  };
}

function formatAltitude(altitude: number) {
  return `${altitude.toLocaleString()} ft MSL`;
}

function formatGroundspeed(speed: number) {
  return `${speed} kts`;
}

function formatHeading(heading: number) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return `${heading}° (${directions[index]})`;
}

export function AircraftMap({ ident, className }: AircraftMapProps) {
  const { data, loading, error, refresh } = useAircraftPosition(ident);

  const hasPosition = data?.position;
  const coordinates = hasPosition && data.position ? formatCoordinates(data.position.latitude, data.position.longitude) : null;

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-robair-green" />
              <CardTitle className="text-xl">Aircraft Location</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
          <CardDescription>
            {loading ? 'Updating position...' : 'Real-time position tracking'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full h-80 bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-blue-50">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(rgba(35, 77, 53, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(35, 77, 53, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              {/* Aircraft marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  {hasPosition && (
                    <div className="absolute inset-0 w-8 h-8 bg-robair-green/30 rounded-full animate-ping"></div>
                  )}
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                    hasPosition ? (data.isEstimated ? 'bg-amber-500' : 'bg-robair-green') : 'bg-gray-400'
                  }`}>
                    <Plane className={`h-4 w-4 text-white ${
                      hasPosition && data.position ? `transform rotate-[${data.position.heading}deg]` : 'transform rotate-45'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Coordinates overlay */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-md text-sm">
                <div className="font-mono text-robair-black/70">
                  <div>Lat: {coordinates?.latitude || "--°--'--\""}</div>
                  <div>Lng: {coordinates?.longitude || "--°--'--\""}</div>
                </div>
              </div>

              {/* Status and flight info */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-md">
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    hasPosition
                      ? data.isEstimated
                        ? 'bg-amber-500'
                        : 'bg-green-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}></div>
                  <span className="text-robair-black/70">
                    {data?.status || (hasPosition ? 'In Flight' : 'On Ground')}
                  </span>
                </div>
                {data?.isEstimated && (
                  <div className="text-xs text-amber-600 mt-1">
                    Estimated Location
                  </div>
                )}
              </div>

              {/* Flight details overlay for active flights */}
              {hasPosition && data.position && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-md text-sm">
                  <div className="space-y-1 text-robair-black/70">
                    <div><strong>Alt:</strong> {formatAltitude(data.position.altitude)}</div>
                    <div><strong>Speed:</strong> {formatGroundspeed(data.position.groundspeed)}</div>
                    <div><strong>Heading:</strong> {formatHeading(data.position.heading)}</div>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {error && (
                <div className="absolute inset-0 bg-red-50/80 backdrop-blur flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <div className="text-red-700 text-sm font-medium">
                      Unable to fetch flight data
                    </div>
                    <div className="text-red-600 text-xs">
                      {error}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refresh}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-robair-light/50 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-robair-black/70">
                {hasPosition && data.position
                  ? `Last updated: ${new Date(data.position.timestamp).toLocaleTimeString()}`
                  : 'Live map shows actual aircraft position when in flight'
                }
              </p>
              {data?.timestamp && (
                <p className="text-xs text-robair-black/50">
                  Data refreshed: {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}