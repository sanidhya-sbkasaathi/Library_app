-- ==============================================================================
-- Migration: 003_users.sql
-- Description: User accounts, librarians, staff, and authentication profiles.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.library_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    auth_user_id UUID,
    full_name TEXT NOT NULL,
    email CITEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Librarian',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_library_user_email UNIQUE (library_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_library_id ON public.library_users(library_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.library_users(email);
