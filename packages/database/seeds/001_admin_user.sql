-- ============================================
-- Seed 001: Admin user for development
-- Password hash must be generated with your app's hash function.
-- In production, users register through the normal flow.
-- ============================================

INSERT INTO users (email, password_hash, role, display_name)
VALUES ('admin@localhost', 'PLACEHOLDER_HASH', 'admin', 'Development Admin')
ON CONFLICT (email) DO NOTHING;
