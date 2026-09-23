-- ==============================================================================
-- Migration: 010_fines.sql
-- Description: Overdue fines, damaged item charges, and payment transactions.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.library_users(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'OVERDUE', -- OVERDUE, DAMAGE, LOSS, OTHER
    status TEXT DEFAULT 'UNPAID', -- UNPAID, PAID, WAIVED
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fines_user_id ON public.fines(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON public.fines(status);

-- Payments Table (Directly used by Library App)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    receipt_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT DEFAULT 'UPI', -- UPI, Cash, Card, NetBanking
    status TEXT DEFAULT 'PAID',
    payment_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_assoc_rec ON public.payments(association_id, receipt_number);
