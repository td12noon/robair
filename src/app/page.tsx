import Image from "next/image";
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
            {/* Company Logo */}
            <div className="flex justify-center lg:justify-start mb-4">
              <Image
                src="/robair-logo.png"
                alt="Rob Air Logo"
                width={200}
                height={200}
                priority
              />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-robair-black">
                Welcome to Rob Air
              </h1>
              <p className="text-lg text-robair-black/70">
                Your Personal Flight Management System
              </p>
            </div>

            <p className="text-xl text-robair-black/80 leading-relaxed">
              Track flights and get AI-powered insights for your aviation adventures. 
              Everything you need to stay informed about your aircraft.
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
          <p className="text-robair-black/70 mt-2">All-time statistics</p>
        </div>
        <FlightAnalytics ident={process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N424BB"} />
      </div>

    </div>
  );
}
