import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface SqlQuery {
  <T extends QueryResultRow = any>(strings: TemplateStringsArray, ...values: any[]): Promise<QueryResult<T>>;
  query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

const sqlFunc = async (strings: TemplateStringsArray, ...values: any[]) => {
  let queryText = strings[0];
  for (let i = 1; i < strings.length; i++) {
    queryText += `$${i}` + strings[i];
  }
  return pool.query(queryText, values);
};

export const sql: SqlQuery = Object.assign(sqlFunc, {
  query: (text: string, params?: any[]) => pool.query(text, params)
});

export async function initDb() {
  if (!process.env.POSTGRES_URL) {
    console.warn("POSTGRES_URL not found. Database initialization skipped.");
    return;
  }

  try {
    // 1. Core Tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(6),
        verification_code_expires TIMESTAMP WITH TIME ZONE,
        reset_password_code VARCHAR(6),
        reset_password_code_expires TIMESTAMP WITH TIME ZONE,
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

    // 2. New Ticket System Tables
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        machine_id INTEGER NOT NULL, -- 1 or 2
        ticket_number INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'invalid'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ticket_machine_logs (
        id SERIAL PRIMARY KEY,
        machine_id INTEGER NOT NULL,
        ticket_number INTEGER NOT NULL,
        ticket_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(machine_id, ticket_number, ticket_at)
      );
    `;

    // 3. Migrations (safe ALTERs)
    const migrations = [
      `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(10)`,
      `ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS tickets INTEGER DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS secret_word VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(6)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code_expires TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`
    ];

    for (const m of migrations) {
      try {
        await sql.query(m);
      } catch (_) { /* column may already exist */ }
    }

    console.log("Postgres database initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}

// Automatically trigger initialization IF we are in a server-side context
if (typeof window === 'undefined') {
  initDb().catch(err => console.error("Critical: initDb failed", err));
}

export default sql;
