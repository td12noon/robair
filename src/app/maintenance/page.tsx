import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Calendar, Cog, Fuel, Settings, AlertTriangle } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-robair-black">Aircraft Maintenance</h1>
          <p className="text-robair-black/70 mt-2">
            Track and manage all maintenance activities for your aircraft
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Maintenance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-robair-green">0</div>
            <p className="text-xs text-robair-black/70">Maintenance entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-robair-green">--</div>
            <p className="text-xs text-robair-black/70">Days ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-robair-black/70">Items pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-robair-black/70">Items overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Propeller</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Propeller maintenance, inspections, and overhauls
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Cog className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Turbine</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Turbine engine maintenance and inspections
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Fuel className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Oil Changes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Engine oil changes and fluid maintenance
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Scheduled Inspections</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Annual, 100-hour, and other scheduled inspections
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Unscheduled</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Emergency repairs and unscheduled maintenance
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Wrench className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle>General</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              General maintenance and miscellaneous repairs
            </CardDescription>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-robair-black/70">0 records</span>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Maintenance Activity</CardTitle>
          <CardDescription>
            Latest maintenance records and upcoming scheduled items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <Wrench className="h-12 w-12 mx-auto text-robair-black/30" />
            <div>
              <h3 className="text-lg font-semibold text-robair-black">No Maintenance Records</h3>
              <p className="text-robair-black/70 mt-2">
                Start by adding your first maintenance record to begin tracking your aircraft's service history.
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add First Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-robair-green/5 to-robair-green/10">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Fuel className="h-6 w-6" />
              <span>Log Oil Change</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Inspection</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <span>Report Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}