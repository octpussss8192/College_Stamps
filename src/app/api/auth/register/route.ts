import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "ニックネームとパスワードを入力してください。" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare('INSERT INTO users (nickname, password) VALUES (?, ?)');
    let info;
    try {
      info = stmt.run(nickname, hashedPassword);
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json({ error: "このニックネームは既に使われています。" }, { status: 400 });
      }
      throw err;
    }

    const userId = Number(info.lastInsertRowid);

    const response = NextResponse.json({ success: true, userId, nickname });
    
    // Set a simple cookie session
    response.cookies.set('gakushoku_session', String(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "登録中にエラーが発生しました。" }, { status: 500 });
  }
}
