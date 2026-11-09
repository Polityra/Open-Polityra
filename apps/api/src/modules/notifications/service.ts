import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export async function listNotifications(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<{ rows: NotificationRow[]; unread: number }> {
  const pool = _getPool();
  const rowsResult = await pool.query(
    "SELECT id, user_id, type, title, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [userId, limit, offset],
  );
  const unreadResult = await pool.query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
    [userId],
  );
  return {
    rows: rowsResult.rows as NotificationRow[],
    unread: parseInt(unreadResult.rows[0].count, 10),
  };
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const pool = _getPool();
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING id",
    [notificationId],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const pool = _getPool();
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id",
    [userId],
  );
  return result.rowCount ?? 0;
}
