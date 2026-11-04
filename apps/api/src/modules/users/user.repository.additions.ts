// Add these two methods to UserRepository (apps/api/src/repositories/user.repository.ts),
// using the same query helper as its other methods.

// async update(id: string, fields: { name: string }): Promise<Omit<UserRow, 'password_hash'> | null> {
//   SQL:  UPDATE users SET name = $2 WHERE id = $1
//         RETURNING id, email, name, role, is_active, created_at, updated_at
//   -> return the first row, or null if none
//   (the updated_at trigger from migration 001 sets updated_at automatically)
// }
//
// async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
//   SQL:  UPDATE users SET password_hash = $2 WHERE id = $1
// }
