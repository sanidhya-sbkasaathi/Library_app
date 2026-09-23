-- ==============================================================================
-- ALL-IN-ONE SUPABASE SCHEMA INITIALIZATION FOR LIBRARY APP
-- Copy and run this once in your Supabase Dashboard > SQL Editor.
-- It initializes all 14 schema migration modules with tables, triggers, and RLS.
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Libraries & Organizations
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

-- 3. Users
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

-- 4. Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Permissions
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

-- 6. Books, Rooms, Seats, Students
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    publication_year INTEGER,
    edition TEXT,
    category TEXT,
    description TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    zone TEXT DEFAULT 'General',
    capacity INTEGER DEFAULT 50,
    ac_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    association_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    room_name TEXT DEFAULT 'Hall A',
    status TEXT DEFAULT 'AVAILABLE',
    student_id TEXT,
    student_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    seat_number TEXT,
    plan_name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    valid_until TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Book Copies
CREATE TABLE IF NOT EXISTS public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL,
    rfid_tag TEXT,
    condition TEXT DEFAULT 'GOOD',
    status TEXT DEFAULT 'AVAILABLE',
    rack_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Issues & Admissions
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id UUID REFERENCES public.book_copies(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.library_users(id) ON DELETE RESTRICT,
    issued_by UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'ISSUED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 9. Returns & Attendance
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE RESTRICT,
    returned_to UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
    return_date TIMESTAMPTZ DEFAULT NOW(),
    condition_on_return TEXT DEFAULT 'GOOD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 10. Fines & Payments
CREATE TABLE IF NOT EXISTS public.fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.library_users(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'OVERDUE',
    status TEXT DEFAULT 'UNPAID',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id TEXT NOT NULL,
    receipt_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT DEFAULT 'UPI',
    status TEXT DEFAULT 'PAID',
    payment_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs
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

-- 12 & 13. Functions and Triggers
CREATE OR REPLACE FUNCTION public.update_book_available_copies()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.books
        SET available_copies = GREATEST(0, available_copies - 1),
            updated_at = NOW()
        WHERE id = (SELECT book_id FROM public.book_copies WHERE id = NEW.copy_id);
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'ISSUED' AND NEW.status = 'RETURNED') THEN
        UPDATE public.books
        SET available_copies = available_copies + 1,
            updated_at = NOW()
        WHERE id = (SELECT book_id FROM public.book_copies WHERE id = NEW.copy_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_book_copies ON public.issues;
CREATE TRIGGER trg_update_book_copies
    AFTER INSERT OR UPDATE OF status ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_book_available_copies();

-- 14. Row-Level Security
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_libraries_all" ON public.libraries;
CREATE POLICY "anon_libraries_all" ON public.libraries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_organizations_all" ON public.organizations;
CREATE POLICY "anon_organizations_all" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_seats_all" ON public.seats;
CREATE POLICY "anon_seats_all" ON public.seats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_students_all" ON public.students;
CREATE POLICY "anon_students_all" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_admissions_all" ON public.admissions;
CREATE POLICY "anon_admissions_all" ON public.admissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_attendance_all" ON public.attendance;
CREATE POLICY "anon_attendance_all" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_payments_all" ON public.payments;
CREATE POLICY "anon_payments_all" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_books_all" ON public.books;
CREATE POLICY "anon_books_all" ON public.books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_book_copies_all" ON public.book_copies;
CREATE POLICY "anon_book_copies_all" ON public.book_copies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_issues_all" ON public.issues;
CREATE POLICY "anon_issues_all" ON public.issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_returns_all" ON public.returns;
CREATE POLICY "anon_returns_all" ON public.returns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_fines_all" ON public.fines;
CREATE POLICY "anon_fines_all" ON public.fines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_audit_logs_all" ON public.audit_logs;
CREATE POLICY "anon_audit_logs_all" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
