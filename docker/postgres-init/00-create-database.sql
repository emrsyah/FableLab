# PostgreSQL Init Script
# This script runs when the postgres container starts for the first time

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS fablelab;

-- Connect to the database
\c fablelab

-- Create extensions if needed (uncomment if using PostGIS or other extensions)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fablelab TO postgres;
