import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('gakushoku_session')?.value;

    if (!sessionId) {
      // Demo mode or not logged in
      return NextResponse.json({ history: [] });
    }

    const stmt = db.prepare(`
      SELECT id, date, time, price, status 
      FROM history 
      WHERE user_id = ? 
      ORDER BY id DESC 
      LIMIT 50
    `);
    const history = stmt.all(Number(sessionId));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("History Error:", error);
    return NextResponse.json({ error: "履歴の取得中にエラーが発生しました。" }, { status: 500 });
  }
}
