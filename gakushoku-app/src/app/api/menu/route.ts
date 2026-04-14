import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { rows } = await sql`SELECT * FROM menu_items ORDER BY id DESC`;
    
    const special = rows.find(r => r.is_today_special) || null;

    return NextResponse.json({ 
      success: true, 
      menus: rows,
      special: special
    });
  } catch (error) {
    console.error("Menu fetch Error:", error);
    return NextResponse.json({ error: "メニューの取得中にエラーが発生しました。" }, { status: 500 });
  }
}
