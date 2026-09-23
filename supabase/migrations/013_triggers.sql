-- ==============================================================================
-- Migration: 013_triggers.sql
-- Description: Automated table triggers for audit and status synchronizations.
-- ==============================================================================

-- Trigger for issue/return copy count updates
DROP TRIGGER IF EXISTS trg_update_book_copies ON public.issues;
CREATE TRIGGER trg_update_book_copies
    AFTER INSERT OR UPDATE OF status ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_book_available_copies();

-- Trigger for library update timestamp
DROP TRIGGER IF EXISTS trg_libraries_updated_at ON public.libraries;
CREATE TRIGGER trg_libraries_updated_at
    BEFORE UPDATE ON public.libraries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger for books update timestamp
DROP TRIGGER IF EXISTS trg_books_updated_at ON public.books;
CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
