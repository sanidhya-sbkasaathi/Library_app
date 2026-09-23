-- ==============================================================================
-- Migration: 011_audit_logs.sql
-- Description: Immutable security and system activity audit trail.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE SET NULL,
    timestamp TEXT,
    event TEXT NOT NULL,
    organization TEXT,
    actor TEXT NOT NULL,
    details TEXT,
    type TEXT DEFAULT 'system',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_library_id ON public.audit_logs(library_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
