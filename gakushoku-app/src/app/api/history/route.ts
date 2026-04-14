import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('gakushoku_session')?.value;

    if (!sessionId) {
      // Demo mode or not logged in
      return NextResponse.json({ history: [] });
    }

    const { rows: history } = await sql`
      SELECT id, date, time, price, status 
      FROM history 
      WHERE user_id = ${Number(sessionId)} 
      ORDER BY id DESC 
      LIMIT 50
    `;

    return NextResponse.json({ history });
  } catch (error) {
    console.error("History Error:", error);
    return NextResponse.json({ error: "履歴の取得中にエラーが発生しました。" }, { status: 500 });
  }
}
