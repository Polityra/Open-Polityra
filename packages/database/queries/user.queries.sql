-- User queries

-- Get user by ID
SELECT id, email, role, display_name, is_active, created_at
FROM users WHERE id = :userId;

-- Get user by email (for login)
SELECT id, email, password_hash, role, display_name, is_active, created_at
FROM users WHERE email = :email;

-- Update user session token
UPDATE sessions SET expires_at = :expiresAt
WHERE token_hash = :tokenHash RETURNING *;

-- Delete expired sessions
DELETE FROM sessions WHERE expires_at < now();
