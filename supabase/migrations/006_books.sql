-- ==============================================================================
-- Migration: 006_books.sql
-- Description: Books catalog, study hall rooms, seats, and student directory.
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS idx_books_library_id ON public.books(library_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);

-- Study Hall Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    zone TEXT DEFAULT 'General',
    capacity INTEGER DEFAULT 50,
    ac_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seats Table (Directly used by Library App)
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID REFERENCES public.libraries(id) ON DELETE CASCADE,
    association_id TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    room_name TEXT DEFAULT 'Hall A',
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    student_id TEXT,
    student_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seats_assoc_seat ON public.seats(association_id, seat_number);

-- Students Table (Directly used by Library App)
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

CREATE INDEX IF NOT EXISTS idx_students_assoc_id ON public.students(association_id, student_id);
