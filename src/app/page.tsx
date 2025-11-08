import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Wrench, Bot, Clock, TrendingUp } from "lucide-react";
import { AircraftMap } from "@/components/aircraft-map";
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
          <AircraftMap
            ident={process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || "N12345"}
            className="relative"
          />
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

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-robair-green/5 to-robair-green/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <TrendingUp className="mr-2 h-6 w-6" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-robair-green">--</div>
              <div className="text-sm text-robair-black/70">Total Flight Hours</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-robair-green">--</div>
              <div className="text-sm text-robair-black/70">Maintenance Records</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-robair-green">
                <Clock className="h-8 w-8 mx-auto" />
              </div>
              <div className="text-sm text-robair-black/70">Always Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
