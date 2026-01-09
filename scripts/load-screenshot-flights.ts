/**
 * Load Flight History from Screenshot Data
 *
 * This script loads all flights from the FlightAware screenshot
 * with calculated distances and Angel Flight identification.
 *
 * Usage: npx tsx --env-file=.env.local scripts/load-screenshot-flights.ts
 */

import { storeFlights } from '../src/lib/supabase';

// Airport coordinates for distance calculation (lat, lon)
const AIRPORTS: Record<string, { lat: number; lon: number; name: string }> = {
  KPSM: { lat: 43.0779, lon: -70.8233, name: 'Portsmouth Intl At Pease' },
  KOWD: { lat: 42.1905, lon: -71.1737, name: 'Norwood Memorial' },
  KCDW: { lat: 40.8752, lon: -74.2814, name: 'Essex County' },
  KRDU: { lat: 35.8776, lon: -78.7875, name: 'Raleigh-Durham Intl' },
  KAPF: { lat: 26.1525, lon: -81.7753, name: 'Naples Muni' },
  KRBW: { lat: 32.9211, lon: -80.6406, name: 'Lowcountry Rgnl' },
  KGNV: { lat: 29.6900, lon: -82.2718, name: 'Gainesville Rgnl' },
  KGHG: { lat: 42.0983, lon: -70.6722, name: 'Marshfield Muni' },
  KGED: { lat: 38.6892, lon: -75.3589, name: 'Delaware Coastal' },
  KBTV: { lat: 44.4720, lon: -73.1533, name: 'Burlington Intl' },
  KRKD: { lat: 44.0601, lon: -69.0992, name: 'Knox County Rgnl' },
  KPWM: { lat: 43.6462, lon: -70.3093, name: 'Portland Intl Jetport' },
  KPNN: { lat: 45.2007, lon: -67.5644, name: 'Princeton Muni' },
  KPQI: { lat: 46.6889, lon: -68.0448, name: 'N Maine Rgnl Presque Isle' },
  KBED: { lat: 42.4700, lon: -71.2890, name: 'Laurence G Hanscom Fld' },
  KBGR: { lat: 44.8074, lon: -68.8281, name: 'Bangor Intl' },
  KFRG: { lat: 40.7288, lon: -73.4134, name: 'Republic' },
  KTDF: { lat: 36.4285, lon: -78.9844, name: 'Person County' },
  KFAY: { lat: 34.9912, lon: -78.8803, name: 'Fayetteville Rgnl' },
};

// Calculate distance between two airports in nautical miles
function calculateDistance(origin: string, dest: string): number {
  const from = AIRPORTS[origin];
  const to = AIRPORTS[dest];

  if (!from || !to) return 0;

  // Haversine formula
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lon - from.lon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Parse time string like "04:40PM EST" to components
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

// Convert date and time to ISO string
function toISODate(dateStr: string, timeStr: string, isEST: boolean): string {
  // Parse date like "08-Jan-2026"
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const dateParts = dateStr.split('-');
  const day = parseInt(dateParts[0]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[2]);

  const { hours, minutes } = parseTime(timeStr);

  // Create date in UTC, adjusting for timezone
  // EST = UTC-5, EDT = UTC-4
  const tzOffset = isEST ? 5 : 4;
  const date = new Date(Date.UTC(year, month, day, hours + tzOffset, minutes));

  return date.toISOString();
}

// Angel Flight airports - flights to/from these are Angel Flights
const ANGEL_FLIGHT_AIRPORTS = new Set([
  'KOWD',  // Norwood Memorial
  'KGED',  // Delaware Coastal
  'KRKD',  // Knox County Regional
  'KPWM',  // Portland Intl Jetport
  'KPNN',  // Princeton Muni
  'KPQI',  // N Maine Regional
  'KBED',  // Lawrence G Hanscom Fld
  'KBGR',  // Bangor Intl
]);

// NOT Angel Flight - any trip through RDU
const NOT_ANGEL_AIRPORTS = new Set([
  'KRDU',  // Raleigh-Durham - NOT an Angel Flight route
]);

// Determine if a flight is an Angel Flight
function isAngelFlight(origin: string, dest: string): boolean {
  // If either endpoint is RDU, NOT an Angel Flight
  if (NOT_ANGEL_AIRPORTS.has(origin) || NOT_ANGEL_AIRPORTS.has(dest)) {
    return false;
  }
  // If either endpoint is an Angel Flight airport, it IS an Angel Flight
  return ANGEL_FLIGHT_AIRPORTS.has(origin) || ANGEL_FLIGHT_AIRPORTS.has(dest);
}

// Flight data from the screenshot
// Format: [date, origin, dest, departure, arrival, duration]
const FLIGHT_DATA: [string, string, string, string, string, string][] = [
  // Jan 2026
  ['08-Jan-2026', 'KPSM', 'KPSM', '04:40PM EST', '05:56PM EST', '1:16'],

  // Dec 2025
  ['31-Dec-2025', 'KOWD', 'KPSM', '11:22AM EST', '11:48AM EST', '0:26'],
  ['31-Dec-2025', 'KPSM', 'KOWD', '07:34AM EST', '08:01AM EST', '0:27'],
  ['20-Dec-2025', 'KCDW', 'KPSM', '03:05PM EST', '04:21PM EST', '1:16'],
  ['20-Dec-2025', 'KRDU', 'KCDW', '12:02PM EST', '02:14PM EST', '2:12'],
  ['19-Dec-2025', 'KAPF', 'KRDU', '03:58PM EST', '05:25PM EST', '1:27'],
  ['19-Dec-2025', 'KRBW', 'KAPF', '12:31PM EST', '03:14PM EST', '2:42'],
  ['13-Dec-2025', 'KGNV', 'KAPF', '02:23PM EST', '03:56PM EST', '1:33'],
  ['13-Dec-2025', 'KRDU', 'KGNV', '10:36AM EST', '01:40PM EST', '3:03'],
  ['12-Dec-2025', 'KPSM', 'KRDU', '12:20PM EST', '04:20PM EST', '4:00'],

  // Nov 2025
  ['29-Nov-2025', 'KGHG', 'KPSM', '03:36PM EST', '04:12PM EST', '0:35'],
  ['29-Nov-2025', 'KRDU', 'KGHG', '11:39AM EST', '03:01PM EST', '3:22'],
  ['25-Nov-2025', 'KGED', 'KRDU', '02:14PM EST', '04:14PM EST', '1:59'],
  ['25-Nov-2025', 'KPSM', 'KGED', '10:32AM EST', '01:00PM EST', '2:28'],
  ['24-Nov-2025', 'KBTV', 'KPSM', '04:57PM EST', '05:51PM EST', '0:53'],
  ['24-Nov-2025', 'KGHG', 'KBTV', '01:29PM EST', '03:03PM EST', '1:34'],
  ['24-Nov-2025', 'KPSM', 'KGHG', '11:35AM EST', '12:06PM EST', '0:31'],
  ['23-Nov-2025', 'KPSM', 'KPSM', '09:06AM EST', '09:30AM EST', '0:24'],
  ['23-Nov-2025', 'KPSM', 'KBTV', '09:06AM EST', '', 'Diverted'],
  ['22-Nov-2025', 'KRKD', 'KPSM', '01:38PM EST', '02:24PM EST', '0:46'],
  ['22-Nov-2025', 'KPWM', 'KRKD', '11:33AM EST', '11:57AM EST', '0:24'],
  ['22-Nov-2025', 'KPSM', 'KPWM', '10:16AM EST', '10:35AM EST', '0:19'],
  ['21-Nov-2025', 'KOWD', 'KPSM', '10:48AM EST', '11:13AM EST', '0:24'],
  ['21-Nov-2025', 'KPSM', 'KOWD', '07:12AM EST', '07:41AM EST', '0:28'],
  ['14-Nov-2025', 'KPNN', 'KPSM', '06:53PM EST', '08:08PM EST', '1:14'],
  ['14-Nov-2025', 'KPWM', 'KPNN', '05:21PM EST', '06:32PM EST', '1:11'],
  ['14-Nov-2025', 'KPSM', 'KPWM', '03:17PM EST', '03:37PM EST', '0:19'],
  ['12-Nov-2025', 'KPQI', 'KPSM', '01:47PM EST', '03:29PM EST', '1:41'],
  ['12-Nov-2025', 'KBED', 'KPQI', '11:21AM EST', '01:07PM EST', '1:46'],
  ['12-Nov-2025', 'KPSM', 'KBED', '09:49AM EST', '10:10AM EST', '0:21'],
  ['07-Nov-2025', 'KBED', 'KPSM', '02:54PM EST', '03:15PM EST', '0:21'],
  ['07-Nov-2025', 'KBGR', 'KBED', '12:50PM EST', '02:11PM EST', '1:20'],
  ['07-Nov-2025', 'KPSM', 'KBGR', '10:02AM EST', '10:55AM EST', '0:53'],
  ['03-Nov-2025', 'KGHG', 'KPSM', '12:54PM EST', '01:26PM EST', '0:31'],
  ['03-Nov-2025', 'KFRG', 'KGHG', '11:32AM EST', '12:28PM EST', '0:55'],
  ['02-Nov-2025', 'KBTV', 'KFRG', '07:52AM EST', '09:21AM EST', '1:28'],
  ['02-Nov-2025', 'KPSM', 'KBTV', '06:18AM EST', '07:18AM EST', '1:00'],

  // Oct 2025
  ['27-Oct-2025', 'KFRG', 'KPSM', '02:32PM EDT', '03:50PM EST', '1:17'],
  ['27-Oct-2025', 'KPSM', 'KFRG', '07:31AM EDT', '08:43AM EST', '1:12'],
  ['26-Oct-2025', 'KTDF', 'KPSM', '02:54PM EDT', '06:20PM EDT', '3:26'],
  ['26-Oct-2025', 'KFAY', 'KTDF', '01:48PM EDT', '02:21PM EDT', '0:32'],
  ['25-Oct-2025', 'KFAY', 'KFAY', '05:10PM EDT', '06:14PM EDT', '1:03'],
  ['25-Oct-2025', 'KFAY', 'KFAY', '03:27PM EDT', '04:36PM EDT', '1:08'],
  ['24-Oct-2025', 'KGED', 'KFAY', '02:11PM EDT', '04:08PM EDT', '1:56'],
  ['24-Oct-2025', 'KPSM', 'KGED', '11:15AM EDT', '01:25PM EDT', '2:10'],
  ['24-Oct-2025', 'KPWM', 'KPSM', '10:22AM EDT', '10:42AM EDT', '0:19'],
  ['24-Oct-2025', 'KPSM', 'KPWM', '09:09AM EDT', '09:29AM EDT', '0:19'],
  ['14-Oct-2025', 'KPSM', 'KPSM', '06:24PM EDT', '06:59PM EDT', '0:34'],
];

async function loadScreenshotFlights() {
  console.log('\n=== Loading Flights from Screenshot ===');
  console.log(`Total flights to load: ${FLIGHT_DATA.length}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Check environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Supabase environment variables not set');
    process.exit(1);
  }

  // Convert flight data to the expected format
  const flights = FLIGHT_DATA.map(([date, origin, dest, departure, arrival, duration]) => {
    const isEST = departure.includes('EST');
    const isDiverted = duration === 'Diverted';
    const isAngel = isAngelFlight(origin, dest);

    // Calculate distance
    const distance = calculateDistance(origin, dest);

    // Generate synthetic flight ID
    const depTime = parseTime(departure);
    const timeStr = `${depTime.hours.toString().padStart(2, '0')}${depTime.minutes.toString().padStart(2, '0')}`;
    const dateStr = date.split('-').reverse().join('').replace(/[A-Za-z]/g, m => {
      const months: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
      };
      return months[m] || m;
    });
    const fa_flight_id = `N424BB-${dateStr}-${timeStr}-${origin}-${dest}`;

    // Build the flight object
    const flight: any = {
      ident: 'N424BB',
      fa_flight_id,
      operator: isAngel ? 'NGF' : undefined,
      aircraft_type: 'SR22',
      status: isDiverted ? 'Diverted' : 'Arrived',
      route_distance: distance,
      origin: {
        code: origin,
        name: AIRPORTS[origin]?.name || origin,
      },
      destination: {
        code: dest,
        name: AIRPORTS[dest]?.name || dest,
      },
      actual_off: toISODate(date, departure, isEST),
    };

    // Add arrival time if not diverted
    if (!isDiverted && arrival) {
      flight.actual_on = toISODate(date, arrival, isEST);
    }

    return flight;
  });

  // Count Angel Flights
  const angelFlights = flights.filter(f => f.operator === 'NGF');
  const totalDistance = flights.reduce((sum, f) => sum + (f.route_distance || 0), 0);
  const angelDistance = angelFlights.reduce((sum, f) => sum + (f.route_distance || 0), 0);

  console.log('=== Flight Summary ===');
  console.log(`Total flights: ${flights.length}`);
  console.log(`Angel Flights: ${angelFlights.length}`);
  console.log(`Total distance: ${totalDistance.toLocaleString()} nm`);
  console.log(`Angel Flight distance: ${angelDistance.toLocaleString()} nm`);

  // Show sample
  console.log('\nSample flight:');
  console.log(JSON.stringify(flights[0], null, 2));

  // Store in database
  console.log('\nStoring flights in database...');
  const result = await storeFlights(flights);

  console.log('\n=== Storage Results ===');
  console.log(`Stored: ${result.stored}`);
  console.log(`Errors: ${result.errors}`);

  console.log('\n=== Done ===');
}

// Run
loadScreenshotFlights();
