// FlightAware AeroAPI Client
// Documentation: https://flightaware.com/commercial/aeroapi/

const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

export class FlightAwareError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'FlightAwareError';
  }
}

export class FlightAwareClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FLIGHTAWARE_API_KEY || '';
    this.baseUrl = FLIGHTAWARE_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new FlightAwareError('FlightAware API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'x-apikey': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FlightAwareError(
          errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof FlightAwareError) {
        throw error;
      }
      throw new FlightAwareError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get flight information by ident (tail number or flight identifier)
   */
  async getFlightByIdent(ident: string, start?: Date, end?: Date, maxPages: number = 100): Promise<FlightResponse> {
    let endpoint = `/flights/${encodeURIComponent(ident)}`;

    const params = new URLSearchParams();
    if (start) params.append('start', start.toISOString());
    if (end) params.append('end', end.toISOString());
    params.append('max_pages', maxPages.toString());

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request<FlightResponse>(endpoint);
  }

  /**
   * Get flight track data (positions) by flight ID
   */
  async getFlightTrack(flightId: string): Promise<FlightTrackResponse> {
    const endpoint = `/flights/${encodeURIComponent(flightId)}/track`;
    return this.request<FlightTrackResponse>(endpoint);
  }

  /**
   * Search for flights by various criteria
   */
  async searchFlights(query: string, options?: FlightSearchOptions): Promise<FlightSearchResponse> {
    const params = new URLSearchParams({ query });

    if (options?.max_pages) params.append('max_pages', options.max_pages.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const endpoint = `/flights/search?${params.toString()}`;
    return this.request<FlightSearchResponse>(endpoint);
  }

  /**
   * Get current flights for an aircraft by ident
   */
  async getCurrentFlights(ident: string): Promise<Flight[]> {
    try {
      const response = await this.getFlightByIdent(ident);
      return response.flights || [];
    } catch (error) {
      console.error('Error getting current flights:', error);
      return [];
    }
  }

  /**
   * Get current position of aircraft
   */
  async getCurrentPosition(ident: string): Promise<Position | null> {
    try {
      const flights = await this.getCurrentFlights(ident);

      // Find the most recent active flight
      const activeFlight = flights.find(flight =>
        flight.status === 'En Route' || flight.status === 'Active'
      ) || flights[0];

      if (!activeFlight?.fa_flight_id) {
        return null;
      }

      const trackData = await this.getFlightTrack(activeFlight.fa_flight_id);
      const positions = trackData.positions || [];

      // Return the most recent position
      return positions.length > 0 ? positions[positions.length - 1] : null;
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }
}

// Types based on FlightAware API documentation
export interface FlightResponse {
  flights: Flight[];
  num_pages: number;
  links?: {
    next?: string;
  };
}

export interface Flight {
  ident: string;
  ident_icao?: string;
  ident_iata?: string;
  fa_flight_id: string;
  operator?: string;
  operator_icao?: string;
  operator_iata?: string;
  flight_number?: string;
  registration?: string;
  atc_ident?: string;
  inbound_fa_flight_id?: string;
  codeshares?: string[];
  blocked?: boolean;
  diverted?: boolean;
  cancelled?: boolean;
  position_only?: boolean;
  origin?: Airport;
  destination?: Airport;
  departure_delay?: number;
  arrival_delay?: number;
  filed_ete?: number;
  foresight_predictions_available?: boolean;
  scheduled_out?: string;
  estimated_out?: string;
  actual_out?: string;
  scheduled_off?: string;
  estimated_off?: string;
  actual_off?: string;
  scheduled_on?: string;
  estimated_on?: string;
  actual_on?: string;
  scheduled_in?: string;
  estimated_in?: string;
  actual_in?: string;
  status: string;
  aircraft_type?: string;
  route_distance?: number;
  filed_airspeed?: number;
  filed_altitude?: number;
  route?: string;
  baggage_claim?: string;
  seats_cabin_business?: number;
  seats_cabin_coach?: number;
  seats_cabin_first?: number;
  gate_origin?: string;
  gate_destination?: string;
  terminal_origin?: string;
  terminal_destination?: string;
  type?: string;
}

export interface Airport {
  code?: string;
  code_icao?: string;
  code_iata?: string;
  code_lid?: string;
  timezone?: string;
  name?: string;
  city?: string;
  airport_info_url?: string;
}

export interface FlightTrackResponse {
  positions: Position[];
}

export interface Position {
  fa_flight_id: string;
  altitude: number;
  altitude_change: string;
  groundspeed: number;
  heading: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  update_type: string;
}

export interface FlightSearchOptions {
  max_pages?: number;
  cursor?: string;
}

export interface FlightSearchResponse {
  flights: Flight[];
  links?: {
    next?: string;
  };
  num_pages: number;
}

// Default client instance
export const flightAware = new FlightAwareClient();