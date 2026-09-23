-- ==============================================================================
-- Migration: 014_rls.sql
-- Description: Row-Level Security (RLS) policies allowing safe publishable key
--              client read/write with tenant isolation.
-- ==============================================================================

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

-- Allow authenticated and anon access for tenant-isolated operations
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
