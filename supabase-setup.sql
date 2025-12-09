-- =============================================
-- FLIGHTS TABLE - Store each flight as a row
-- =============================================

-- Create flights table (individual flight records)
CREATE TABLE IF NOT EXISTS flights (
  id BIGSERIAL PRIMARY KEY,
  ident TEXT NOT NULL,                    -- Aircraft tail number (e.g., N424BB)
  fa_flight_id TEXT NOT NULL UNIQUE,      -- FlightAware unique flight ID
  operator TEXT,                          -- Operator code (e.g., NGF for Angel Flight)
  origin_code TEXT,                       -- Origin airport code
  destination_code TEXT,                  -- Destination airport code
  status TEXT,                            -- Flight status
  route_distance INTEGER,                 -- Distance in nautical miles
  aircraft_type TEXT,                     -- Aircraft type
  flight_date TIMESTAMP WITH TIME ZONE,   -- Date of the flight (actual_off or scheduled_off)
  flight_data JSONB NOT NULL,             -- Full flight data from FlightAware
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_flights_ident ON flights(ident);
CREATE INDEX IF NOT EXISTS idx_flights_fa_flight_id ON flights(fa_flight_id);
CREATE INDEX IF NOT EXISTS idx_flights_flight_date ON flights(flight_date DESC);
CREATE INDEX IF NOT EXISTS idx_flights_ident_date ON flights(ident, flight_date DESC);
CREATE INDEX IF NOT EXISTS idx_flights_operator ON flights(operator);

-- Enable Row Level Security (RLS)
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on flights" ON flights
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- API FETCH LOG - Track when we last called the API
-- =============================================

CREATE TABLE IF NOT EXISTS api_fetch_log (
  id BIGSERIAL PRIMARY KEY,
  ident TEXT NOT NULL UNIQUE,             -- Aircraft tail number
  last_fetched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  flights_fetched INTEGER DEFAULT 0,       -- How many flights were fetched
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_fetch_log_ident ON api_fetch_log(ident);

ALTER TABLE api_fetch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on api_fetch_log" ON api_fetch_log
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- LEGACY TABLE (can be dropped after migration)
-- =============================================

-- Old flight_data_cache table - keeping for reference
-- You can drop this after confirming the new system works:
-- DROP TABLE IF EXISTS flight_data_cache;

CREATE TABLE IF NOT EXISTS flight_data_cache (
  id BIGSERIAL PRIMARY KEY,
  ident TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_data_cache_ident ON flight_data_cache(ident);
CREATE INDEX IF NOT EXISTS idx_flight_data_cache_last_updated ON flight_data_cache(last_updated);

ALTER TABLE flight_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on flight_data_cache" ON flight_data_cache
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to clean up very old flights (optional, keeps last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_flights()
RETURNS void AS $$
BEGIN
  DELETE FROM flights
  WHERE flight_date < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;
