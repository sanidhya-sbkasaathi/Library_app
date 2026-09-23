-- ==============================================================================
-- Migration: 012_functions.sql
-- Description: Stored procedures and utility functions.
-- ==============================================================================

-- Function to safely update book copy counts upon issue or return
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

-- Automated timestamp updater function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
