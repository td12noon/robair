import { Plane } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import { FlightAnalytics } from "@/components/flight-analytics";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-robair-green">
                <Plane className="h-8 w-8 text-background" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-robair-black">
                  Welcome to Rob Air
                </h1>
                <p className="text-lg text-robair-black/70">
                  Your Personal Flight Management System
                </p>
              </div>
            </div>

            <p className="text-xl text-robair-black/80 leading-relaxed">
              Track flights in real-time, manage aircraft maintenance, and get AI-powered insights
              for your aviation adventures. Everything you need to stay informed about your aircraft.
            </p>
          </div>

          {/* Right Side - Aircraft Location Map */}
          <div className="relative">
            <FlightMap
              ident={process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N424BB"}
              height="500px"
            />
          </div>
        </div>
      </div>


      {/* Flight Analytics */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-robair-black">Flight Analytics</h2>
          <p className="text-robair-black/70 mt-2">Your {new Date().getFullYear()} aviation summary</p>
        </div>
        <FlightAnalytics ident={process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N424BB"} />
      </div>

    </div>
  );
}
