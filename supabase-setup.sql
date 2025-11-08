-- Create flight data cache table
CREATE TABLE IF NOT EXISTS flight_data_cache (
  id BIGSERIAL PRIMARY KEY,
  ident TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_flight_data_cache_ident ON flight_data_cache(ident);
CREATE INDEX IF NOT EXISTS idx_flight_data_cache_last_updated ON flight_data_cache(last_updated);

-- Enable Row Level Security (RLS)
ALTER TABLE flight_data_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on flight_data_cache" ON flight_data_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Optional: Create a function to automatically clean up old cache entries
CREATE OR REPLACE FUNCTION cleanup_old_flight_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM flight_data_cache
  WHERE last_updated < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-flight-cache', '0 2 * * *', 'SELECT cleanup_old_flight_cache();');