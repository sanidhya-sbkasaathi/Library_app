-- ==============================================================================
-- Migration: 005_permissions.sql
-- Description: Fine-grained permissions catalog and role-to-permission mapping.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT UNIQUE NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed core permission nodes
INSERT INTO public.permissions (permission_key, module, description)
VALUES
    ('org.settings.manage', 'Settings', 'Update library profile, seats, and rooms'),
    ('students.create', 'Students', 'Register new admission and assign seat'),
    ('students.read', 'Students', 'View enrolled student directory and contact info'),
    ('books.catalog', 'Books', 'Add, edit, or decommission books in catalog'),
    ('books.circulate', 'Circulation', 'Process book borrowing and return logs'),
    ('finance.collect', 'Finance', 'Collect membership payments and print receipts'),
    ('reports.export', 'Reporting', 'Export attendance and finance records')
ON CONFLICT (permission_key) DO NOTHING;
