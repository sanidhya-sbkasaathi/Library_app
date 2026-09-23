-- ==============================================================================
-- Migration: 002_libraries.sql
-- Description: Core library / organization multi-tenant entity table.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code CITEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email CITEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    plan_tier TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'ACTIVE',
    total_seats INTEGER DEFAULT 100,
    total_rooms INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward compatibility alias view for organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    owner TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active',
    plan TEXT DEFAULT 'Standard',
    total_seats INTEGER DEFAULT 100,
    active_users INTEGER DEFAULT 0,
    devices INTEGER DEFAULT 1,
    last_sync TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_libraries_code ON public.libraries(code);
CREATE INDEX IF NOT EXISTS idx_organizations_org_id ON public.organizations(org_id);
