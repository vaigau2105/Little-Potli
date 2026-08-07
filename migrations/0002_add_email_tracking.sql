-- Add email tracking columns to orders table
ALTER TABLE orders ADD COLUMN email_status TEXT DEFAULT 'pending' CHECK(email_status IN ('pending', 'sent', 'failed', 'skipped'));
ALTER TABLE orders ADD COLUMN email_sent_at DATETIME;
ALTER TABLE orders ADD COLUMN email_error TEXT;
