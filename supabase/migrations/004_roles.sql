-- ==============================================================================
-- Migration: 004_roles.sql
-- Description: Role definitions and system access level hierarchy.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed predefined standard roles
INSERT INTO public.roles (role_key, role_name, description, is_system)
VALUES
    ('super_admin', 'Super Admin', 'Full system control, crypto identity management, and billing authority', true),
    ('librarian', 'Librarian', 'Day-to-day operations, student onboarding, seat allocations, and cataloging', true),
    ('assistant', 'Assistant', 'Book issues, returns, student check-in, and verification', true),
    ('receptionist', 'Receptionist', 'Visitor management, student inquiries, and attendance logging', true),
    ('viewer', 'Viewer', 'Read-only access to reporting dashboards and audit logs', true)
ON CONFLICT (role_key) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description;
