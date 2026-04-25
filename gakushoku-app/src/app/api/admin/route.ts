import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const ADMIN_PASSWORD = "amagasaki_usb";

function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  return authHeader === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = req.nextUrl.searchParams.get("tab") || "ホーム";

  try {
    switch (tab) {
      case "ホーム": {
        const usersResult = await sql`SELECT * FROM users ORDER BY id DESC`;
        const countsResult = await sql`
          SELECT 
            (SELECT COUNT(*) FROM used_hashes) as hash_count,
            (SELECT COUNT(*) FROM used_hashes WHERE created_at >= CURRENT_DATE) as today_hash_count,
            (SELECT COUNT(*) FROM menu_items) as menu_count,
            (SELECT COUNT(*) FROM history) as history_count
        `;
        return NextResponse.json({
          users: usersResult.rows,
          counts: {
            users: usersResult.rows.length,
            hashes: Number(countsResult.rows[0]?.hash_count || 0),
            today_hashes: Number(countsResult.rows[0]?.today_hash_count || 0),
            menus: Number(countsResult.rows[0]?.menu_count || 0),
            history: Number(countsResult.rows[0]?.history_count || 0),
          }
        });
      }

      case "メニュー": {
        const menusResult = await sql`SELECT * FROM menu_items ORDER BY id DESC`;
        return NextResponse.json({ menus: menusResult.rows });
      }

      case "スキャン": {
        const hashesResult = await sql`SELECT * FROM used_hashes ORDER BY created_at DESC LIMIT 100`;
        const usersResult = await sql`SELECT id, nickname FROM users ORDER BY id DESC`;
        return NextResponse.json({ hashes: hashesResult.rows, users: usersResult.rows });
      }

      case "特典": {
        const usersResult = await sql`SELECT id, nickname, stamps FROM users ORDER BY id DESC`;
        return NextResponse.json({ users: usersResult.rows });
      }

      case "履歴": {
        const historyResult = await sql`SELECT * FROM history ORDER BY created_at DESC LIMIT 100`;
        return NextResponse.json({ history: historyResult.rows });
      }

      default:
        return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "deleteUser": {
        const { id } = body;
        await sql`DELETE FROM history WHERE user_id = ${Number(id)}`;
        await sql`DELETE FROM used_hashes WHERE user_id = ${Number(id)}`;
        await sql`DELETE FROM users WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true });
      }

      case "deleteHash": {
        const { hash } = body;
        await sql`DELETE FROM used_hashes WHERE hash = ${hash}`;
        return NextResponse.json({ success: true });
      }

      case "addHash": {
        const { hash, userId } = body;
        await sql`INSERT INTO used_hashes (hash, user_id) VALUES (${hash}, ${Number(userId)})`;
        return NextResponse.json({ success: true });
      }

      case "deleteMenu": {
        const { id } = body;
        await sql`DELETE FROM menu_items WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true });
      }

      case "addMenu": {
        const { name, description, price, isSpecial, dayOfWeek, imageUrl } = body;
        if (isSpecial) {
          await sql`UPDATE menu_items SET is_today_special = false WHERE day_of_week IS NULL`;
        }
        await sql`INSERT INTO menu_items (name, description, price, is_today_special, day_of_week, image_url) VALUES (${name}, ${description || ''}, ${price ? Number(price) : null}, ${!!isSpecial}, ${dayOfWeek || null}, ${imageUrl || null})`;
        return NextResponse.json({ success: true });
      }

      case "updateStamps": {
        const { userId, stamps } = body;
        await sql`UPDATE users SET stamps = ${Number(stamps)} WHERE id = ${Number(userId)}`;
        return NextResponse.json({ success: true });
      }

      case "verifyPassword": {
        const { password } = body;
        return NextResponse.json({ valid: password === ADMIN_PASSWORD });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
