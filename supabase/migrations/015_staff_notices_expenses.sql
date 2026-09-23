-- ==============================================================================
-- Migration: 015_staff_notices_expenses.sql
-- Description: Library staff profiles, announcements, and expenses tracking.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Librarian',
    mobile TEXT,
    email TEXT,
    salary NUMERIC DEFAULT 0,
    shift TEXT DEFAULT 'Full Day',
    status TEXT DEFAULT 'Active',
    joining_date TEXT,
    role_id TEXT,
    digital_signature TEXT,
    permissions JSONB,
    signing_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_assoc ON public.staff(association_id);

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'Announcement',
    audience TEXT DEFAULT 'All Students',
    date TEXT,
    status TEXT DEFAULT 'Active',
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_assoc ON public.notices(association_id);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    vendor TEXT,
    method TEXT DEFAULT 'Cash',
    description TEXT,
    attachment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_assoc ON public.expenses(association_id);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_staff_all" ON public.staff;
CREATE POLICY "anon_staff_all" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_notices_all" ON public.notices;
CREATE POLICY "anon_notices_all" ON public.notices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_expenses_all" ON public.expenses;
CREATE POLICY "anon_expenses_all" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
