import { sql } from '@vercel/postgres';

export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        stamps INTEGER DEFAULT 0,
        tickets INTEGER DEFAULT 0,
        secret_word VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date VARCHAR(255),
        time VARCHAR(255),
        price INTEGER,
        hash VARCHAR(255),
        status VARCHAR(255) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS used_hashes (
        hash VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER,
        is_today_special BOOLEAN DEFAULT false,
        day_of_week VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS lottery_winners (
        id SERIAL PRIMARY KEY,
        month VARCHAR(7) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ticket_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'lottery'
        is_global BOOLEAN DEFAULT true,
        target_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notification_reads (
        user_id INTEGER NOT NULL REFERENCES users(id),
        notification_id INTEGER NOT NULL REFERENCES notifications(id),
        read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, notification_id)
      );
    `;

    // Migration: add columns if they don't exist
    try {
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(10)`;
    } catch (_) { /* column may already exist */ }
    try {
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(255)`;
    } catch (_) { /* column may already exist */ }
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tickets INTEGER DEFAULT 0`;
    } catch (_) { /* column may already exist */ }
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_word VARCHAR(255)`;
    } catch (_) { /* column may already exist */ }
    console.log("Postgres database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

// Automatically trigger initialization if needed
initDb();

export default sql;
