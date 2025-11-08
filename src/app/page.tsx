import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Wrench, Bot, Clock, TrendingUp } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import { FlightAnalytics } from "@/components/flight-analytics";
import Link from "next/link";

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

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Plane className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle className="text-xl">Flight Tracking</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Real-time flight information powered by FlightAware API. Track your aircraft's
              current location, flight path, and detailed trip history.
            </CardDescription>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/trips">View Trips</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Wrench className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle className="text-xl">Maintenance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Keep detailed records of all maintenance activities. Track oil changes,
              propeller maintenance, turbine servicing, and more.
            </CardDescription>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/maintenance">Manage Records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-robair-green/10 rounded-lg">
                <Bot className="h-6 w-6 text-robair-green" />
              </div>
              <CardTitle className="text-xl">AI Assistant</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Ask questions about your aircraft. "When's the last oil change?"
              "How many flights to LAX?" Get instant, intelligent answers.
            </CardDescription>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/chat">Ask AI</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Flight Analytics */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-robair-black">Flight Analytics</h2>
          <p className="text-robair-black/70 mt-2">Your {new Date().getFullYear()} aviation summary</p>
        </div>
        <FlightAnalytics ident={process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N424BB"} />
      </div>

      {/* Welcome Message */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <p className="text-lg text-robair-black/80">
            Welcome to your personal aviation command center. Rob Air brings together
            everything you need to manage and track your aircraft in one beautiful,
            easy-to-use platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
