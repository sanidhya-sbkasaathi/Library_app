-- ==============================================================================
-- Migration: 001_extensions.sql
-- Description: Enable core PostgreSQL extensions required for UUID generation,
--              cryptographic hashing, and case-insensitive text matching.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
