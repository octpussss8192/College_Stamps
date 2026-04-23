import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const DAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

export async function GET(req: NextRequest) {
  try {
    const { rows } = await sql`SELECT * FROM menu_items ORDER BY id DESC`;
    
    // Determine today's day of week in Japanese
    const todayIndex = new Date().getDay();
    const todayName = DAY_NAMES[todayIndex];
    
    // Find special: first check day_of_week match, then fallback to manual flag
    const daySpecial = rows.find(r => r.day_of_week === todayName);
    const manualSpecial = rows.find(r => r.is_today_special && !r.day_of_week);
    const special = daySpecial || manualSpecial || null;

    // Get today's total scan count
    const countResult = await sql`SELECT COUNT(*) as count FROM used_hashes WHERE created_at >= CURRENT_DATE`;
    const todayHashes = Number(countResult.rows[0]?.count || 0);

    return NextResponse.json({ 
      success: true, 
      menus: rows,
      special: special,
      today: todayName,
      todayHashes: todayHashes
    });
  } catch (error) {
    console.error("Menu fetch Error:", error);
    return NextResponse.json({ error: "メニューの取得中にエラーが発生しました。" }, { status: 500 });
  }
}
