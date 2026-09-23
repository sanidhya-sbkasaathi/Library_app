-- ==============================================================================
-- Migration: 008_issues.sql
-- Description: Book issue tracking & student admissions ledger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id UUID REFERENCES public.book_copies(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.library_users(id) ON DELETE RESTRICT,
    issued_by UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'ISSUED', -- ISSUED, RETURNED, OVERDUE, LOST
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_copy_id ON public.issues(copy_id);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON public.issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);

-- Admissions Table (Directly used by Library App)
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    admission_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    plan_name TEXT,
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'UPI',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admissions_assoc_no ON public.admissions(association_id, admission_number);
