import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('gakushoku_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const stmt = db.prepare('SELECT id, nickname, stamps FROM users WHERE id = ?');
    const user = stmt.get(sessionId) as { id: number, nickname: string, stamps: number } | undefined;

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: { id: user.id, nickname: user.nickname, stamps: user.stamps } 
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
