import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('gakushoku_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { rows } = await sql`SELECT id, nickname, stamps, tickets, created_at FROM users WHERE id = ${Number(sessionId)}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: { id: user.id, nickname: user.nickname, stamps: user.stamps, tickets: user.tickets || 0, created_at: user.created_at } 
    });
  } catch (error) {
    console.error("Auth me Error:", error);
    return NextResponse.json({ error: "認証情報の取得中にエラーが発生しました。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Logout
  const response = NextResponse.json({ success: true });
  response.cookies.delete('gakushoku_session');
  return response;
}
