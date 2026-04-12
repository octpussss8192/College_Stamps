import Database from 'better-sqlite3';
import path from 'path';

// Define DB path
// Vercelはルートディレクトリが読み取り専用のため、/tmp フォルダを利用します
// ※注意: /tmp は一時領域のため、データはしばらくすると消去されます。本格運用には Vercel Postgres 等が必要です。
const dbPath = process.env.VERCEL ? '/tmp/gakushoku.db' : path.join(process.cwd(), 'gakushoku.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    stamps INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT,
    time TEXT,
    price INTEGER,
    hash TEXT,
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS used_hashes (
    hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
