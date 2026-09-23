/**
 * SQLite Relational Schema Definitions
 * Maps all existing LMS entities into standard relational SQLite tables with indexes.
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL: string[] = [
  // 1. Associations / Organizations
  `CREATE TABLE IF NOT EXISTS associations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    owner TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    gst TEXT,
    total_seats INTEGER DEFAULT 100,
    total_rooms INTEGER DEFAULT 2,
    active_students INTEGER DEFAULT 0,
    monthly_revenue REAL DEFAULT 0,
    currency TEXT DEFAULT '₹',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    logo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 2. Users & Staff Logins
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    pin TEXT DEFAULT '1234',
    phone TEXT,
    status TEXT DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 3. Rooms
  `CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    floor TEXT DEFAULT 'Ground',
    capacity INTEGER DEFAULT 50,
    occupied INTEGER DEFAULT 0,
    type TEXT DEFAULT 'Reading Hall',
    is_ac INTEGER DEFAULT 1,
    has_wifi INTEGER DEFAULT 1,
    has_cctv INTEGER DEFAULT 1,
    has_charging INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 4. Seats
  `CREATE TABLE IF NOT EXISTS seats (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    row TEXT,
    col INTEGER,
    type TEXT DEFAULT 'Standard',
    has_charging INTEGER DEFAULT 1,
    has_lamp INTEGER DEFAULT 0,
    has_locker INTEGER DEFAULT 0,
    status TEXT DEFAULT 'AVAILABLE',
    student_id TEXT,
    student_name TEXT,
    student_mobile TEXT,
    membership_end TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_seats_room ON seats(room_id);`,
  `CREATE INDEX IF NOT EXISTS idx_seats_num ON seats(seat_number);`,
  `CREATE INDEX IF NOT EXISTS idx_seats_assoc ON seats(association_id);`,

  // 5. Students
  `CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    photo TEXT,
    mobile TEXT NOT NULL,
    email TEXT,
    gender TEXT DEFAULT 'Other',
    dob TEXT,
    address TEXT,
    father_name TEXT,
    emergency_contact TEXT,
    id_proof_type TEXT,
    id_proof_number TEXT,
    admission_date TEXT,
    membership_plan TEXT,
    membership_status TEXT DEFAULT 'Active',
    expiry_date TEXT,
    seat_number TEXT,
    room_id TEXT,
    balance_due REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_students_id ON students(student_id);`,
  `CREATE INDEX IF NOT EXISTS idx_students_assoc ON students(association_id);`,
  `CREATE INDEX IF NOT EXISTS idx_students_status ON students(membership_status);`,

  // 6. Admissions
  `CREATE TABLE IF NOT EXISTS admissions (
    id TEXT PRIMARY KEY,
    admission_no TEXT NOT NULL,
    association_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    room_name TEXT,
    plan_name TEXT,
    date TEXT NOT NULL,
    amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'UPI',
    status TEXT DEFAULT 'Active',
    receipt_no TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_admissions_student ON admissions(student_id);`,

  // 7. Membership Plans
  `CREATE TABLE IF NOT EXISTS membership_plans (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    discount REAL DEFAULT 0,
    description TEXT,
    seat_type TEXT DEFAULT 'Standard',
    benefits TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 8. Attendance Records
  `CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    room_name TEXT,
    date TEXT NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    duration_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Present',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);`,

  // 9. Payments & Transactions
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    receipt_no TEXT NOT NULL,
    association_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    seat_number TEXT,
    plan_name TEXT,
    amount REAL NOT NULL,
    method TEXT DEFAULT 'UPI',
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Completed',
    notes TEXT,
    device_id TEXT,
    received_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);`,

  // 10. Lockers
  `CREATE TABLE IF NOT EXISTS lockers (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    locker_no TEXT NOT NULL,
    status TEXT DEFAULT 'AVAILABLE',
    student_id TEXT,
    student_name TEXT,
    deposit REAL DEFAULT 0,
    expiry_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 11. Expenses
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    vendor TEXT,
    method TEXT DEFAULT 'Cash',
    description TEXT,
    attachment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 12. Notices
  `CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Announcement',
    audience TEXT DEFAULT 'All Students',
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    pinned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 13. Visitors
  `CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    purpose TEXT,
    visited_person TEXT,
    entry_time TEXT NOT NULL,
    exit_time TEXT,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Inside',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 14. Complaints
  `CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    complaint_no TEXT NOT NULL,
    association_id TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    assigned_staff TEXT,
    status TEXT DEFAULT 'New',
    date TEXT NOT NULL,
    resolution TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 15. Staff
  `CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    salary REAL DEFAULT 0,
    shift TEXT DEFAULT 'Full Day (8 AM - 8 PM)',
    status TEXT DEFAULT 'Active',
    joining_date TEXT,
    role_id TEXT,
    digital_signature TEXT,
    permissions TEXT,
    signing_payload TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 16. Books (Library Catalog)
  `CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    publication_year INTEGER,
    edition TEXT,
    category TEXT DEFAULT 'General',
    description TEXT,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    cover_image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);`,
  `CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);`,

  // 17. Book Copies
  `CREATE TABLE IF NOT EXISTS book_copies (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    rfid_tag TEXT,
    condition TEXT DEFAULT 'GOOD',
    status TEXT DEFAULT 'AVAILABLE',
    rack_location TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 18. Audit Logs
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT,
    device TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,

  // 19. Notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'sync',
    timestamp TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    time_ago TEXT,
    created_at TEXT NOT NULL
  );`,

  // 20. Devices
  `CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    association_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    user TEXT,
    last_active TEXT,
    last_sync TEXT,
    status TEXT DEFAULT 'Online',
    ip TEXT,
    license_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 21. Sync Outbox (DURABLE OFFLINE QUEUE)
  `CREATE TABLE IF NOT EXISTS sync_outbox (
    id TEXT PRIMARY KEY,
    library_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    last_error TEXT,
    idempotency_key TEXT UNIQUE NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_status ON sync_outbox(status, created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_idemp ON sync_outbox(idempotency_key);`,

  // 22. Sync Metadata
  `CREATE TABLE IF NOT EXISTS sync_metadata (
    library_id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    last_push_cursor TEXT,
    last_pull_cursor TEXT,
    last_successful_sync TEXT,
    schema_version INTEGER NOT NULL DEFAULT 1
  );`,

  // 23. Installation Metadata (Key-Value configuration)
  `CREATE TABLE IF NOT EXISTS installation_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  // 24. Schema Migrations History
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );`,
];
