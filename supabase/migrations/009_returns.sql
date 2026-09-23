-- ==============================================================================
-- Migration: 009_returns.sql
-- Description: Book return handling, conditions, and daily attendance logs.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE RESTRICT,
    returned_to UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
    return_date TIMESTAMPTZ DEFAULT NOW(),
    condition_on_return TEXT DEFAULT 'GOOD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_issue_id ON public.returns(issue_id);

-- Attendance Table (Directly used by Library App)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'Inside',
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_assoc_date ON public.attendance(association_id, date);
