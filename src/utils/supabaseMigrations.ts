/**
 * Pre-bundled deterministic Supabase SQL Migrations (14-migration suite)
 * Bundled directly in frontend/desktop client for zero-dependency execution.
 */

export interface MigrationInfo {
  version: string;
  filename: string;
  name: string;
  description: string;
  sql: string;
}

export const MIGRATION_MANIFEST: MigrationInfo[] = [
  {
    version: '001',
    filename: '001_extensions.sql',
    name: 'PostgreSQL Extensions',
    description: 'Enable uuid-ossp, pgcrypto, citext extensions',
    sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";`
  },
  {
    version: '002',
    filename: '002_libraries.sql',
    name: 'Libraries & Organizations',
    description: 'Core multi-tenant organization entity tables',
    sql: `CREATE TABLE IF NOT EXISTS public.libraries (
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

CREATE INDEX IF NOT EXISTS idx_libraries_code ON public.libraries(code);
CREATE INDEX IF NOT EXISTS idx_organizations_org_id ON public.organizations(org_id);`
  },
  {
    version: '003',
    filename: '003_users.sql',
    name: 'Users & Authentication',
    description: 'Library user accounts and credential metadata',
    sql: `CREATE TABLE IF NOT EXISTS public.library_users (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.library_users(email);`
  },
  {
    version: '004',
    filename: '004_roles.sql',
    name: 'RBAC Roles Matrix',
    description: 'Role-based access control definitions',
    sql: `CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (role_key, role_name, description, is_system)
VALUES
    ('super_admin', 'Super Admin', 'Full system control, crypto identity management, and billing authority', true),
    ('librarian', 'Librarian', 'Day-to-day operations, student onboarding, seat allocations, and cataloging', true),
    ('assistant', 'Assistant', 'Book issues, returns, student check-in, and verification', true),
    ('receptionist', 'Receptionist', 'Visitor management, student inquiries, and attendance logging', true),
    ('viewer', 'Viewer', 'Read-only access to reporting dashboards and audit logs', true)
ON CONFLICT (role_key) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description;`
  },
  {
    version: '005',
    filename: '005_permissions.sql',
    name: 'System Permissions',
    description: 'Granular permissions and role-permission mappings',
    sql: `CREATE TABLE IF NOT EXISTS public.permissions (
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

INSERT INTO public.permissions (permission_key, module, description)
VALUES
    ('org.settings.manage', 'Settings', 'Update library profile, seats, and rooms'),
    ('students.create', 'Students', 'Register new admission and assign seat'),
    ('students.read', 'Students', 'View enrolled student directory and contact info'),
    ('books.catalog', 'Books', 'Add, edit, or decommission books in catalog'),
    ('books.circulate', 'Circulation', 'Process book borrowing and return logs'),
    ('finance.collect', 'Finance', 'Collect membership payments and print receipts'),
    ('reports.export', 'Reporting', 'Export attendance and finance records')
ON CONFLICT (permission_key) DO NOTHING;`
  },
  {
    version: '006',
    filename: '006_books.sql',
    name: 'Catalog & Books',
    description: 'Book titles, study hall rooms, seats, and student directory',
    sql: `CREATE TABLE IF NOT EXISTS public.books (
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

CREATE INDEX IF NOT EXISTS idx_books_library_id ON public.books(library_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);

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

CREATE INDEX IF NOT EXISTS idx_seats_assoc_seat ON public.seats(association_id, seat_number);

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

CREATE INDEX IF NOT EXISTS idx_students_assoc_id ON public.students(association_id, student_id);`
  },
  {
    version: '007',
    filename: '007_book_copies.sql',
    name: 'Book Physical Copies',
    description: 'Inventory copies, barcodes, rack locations',
    sql: `CREATE TABLE IF NOT EXISTS public.book_copies (
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

CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON public.book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_barcode ON public.book_copies(barcode);
CREATE INDEX IF NOT EXISTS idx_book_copies_status ON public.book_copies(status);`
  },
  {
    version: '008',
    filename: '008_issues.sql',
    name: 'Circulation Issues',
    description: 'Book check-out tracking, due dates, student links & admissions',
    sql: `CREATE TABLE IF NOT EXISTS public.issues (
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

CREATE INDEX IF NOT EXISTS idx_issues_copy_id ON public.issues(copy_id);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON public.issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);

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

CREATE INDEX IF NOT EXISTS idx_admissions_assoc_no ON public.admissions(association_id, admission_number);`
  },
  {
    version: '009',
    filename: '009_returns.sql',
    name: 'Circulation Returns',
    description: 'Book check-in logs, return condition & attendance logs',
    sql: `CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.issues(id) ON DELETE RESTRICT,
    returned_to UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
    return_date TIMESTAMPTZ DEFAULT NOW(),
    condition_on_return TEXT DEFAULT 'GOOD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_issue_id ON public.returns(issue_id);

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

CREATE INDEX IF NOT EXISTS idx_attendance_assoc_date ON public.attendance(association_id, date);`
  },
  {
    version: '010',
    filename: '010_fines.sql',
    name: 'Fines & Payments',
    description: 'Overdue penalties, fee calculation & payment receipts',
    sql: `CREATE TABLE IF NOT EXISTS public.fines (
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

CREATE INDEX IF NOT EXISTS idx_fines_user_id ON public.fines(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON public.fines(status);

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

CREATE INDEX IF NOT EXISTS idx_payments_assoc_rec ON public.payments(association_id, receipt_number);`
  },
  {
    version: '011',
    filename: '011_audit_logs.sql',
    name: 'Audit & Compliance',
    description: 'Immutable system activity and event logging',
    sql: `CREATE TABLE IF NOT EXISTS public.audit_logs (
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);`
  },
  {
    version: '012',
    filename: '012_functions.sql',
    name: 'Stored Procedures',
    description: 'Automated book count and timestamp update functions',
    sql: `CREATE OR REPLACE FUNCTION public.update_book_available_copies()
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`
  },
  {
    version: '013',
    filename: '013_triggers.sql',
    name: 'Database Triggers',
    description: 'Automated table triggers for copy count and timestamps',
    sql: `DROP TRIGGER IF EXISTS trg_update_book_copies ON public.issues;
CREATE TRIGGER trg_update_book_copies
    AFTER INSERT OR UPDATE OF status ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_book_available_copies();

DROP TRIGGER IF EXISTS trg_libraries_updated_at ON public.libraries;
CREATE TRIGGER trg_libraries_updated_at
    BEFORE UPDATE ON public.libraries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated_at ON public.books;
CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();`
  },
  {
    version: '014',
    filename: '014_rls.sql',
    name: 'Row-Level Security (RLS)',
    description: 'Row-Level Security policies allowing safe publishable client read/write',
    sql: `ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "anon_audit_logs_all" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);`
  },
  {
    version: '015',
    filename: '015_staff_notices_expenses.sql',
    name: 'Staff, Notices & Expenses Modules',
    description: 'Staff profiles, announcements, and operational expenses management',
    sql: `CREATE TABLE IF NOT EXISTS public.staff (
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

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_staff_all" ON public.staff;
CREATE POLICY "anon_staff_all" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_notices_all" ON public.notices;
CREATE POLICY "anon_notices_all" ON public.notices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_expenses_all" ON public.expenses;
CREATE POLICY "anon_expenses_all" ON public.expenses FOR ALL USING (true) WITH CHECK (true);`
  }
];
