-- ==============================================================================
-- Migration: 007_book_copies.sql
-- Description: Individual book physical inventory barcode tracking & condition.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL,
    rfid_tag TEXT,
    condition TEXT DEFAULT 'GOOD', -- NEW, GOOD, FAIR, DAMAGED, LOST
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, ISSUED, RESERVED, IN_TRANSIT, LOST
    rack_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_book_copies_book_id ON public.book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_book_copies_barcode ON public.book_copies(barcode);
CREATE INDEX IF NOT EXISTS idx_book_copies_status ON public.book_copies(status);
