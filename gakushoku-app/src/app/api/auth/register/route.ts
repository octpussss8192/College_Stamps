import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password, secretWord } = await req.json();

    if (!nickname || !password || !secretWord) {
      return NextResponse.json({ error: "ニックネーム、パスワード、秘密の言葉を入力してください。" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE nickname = ${nickname}`;
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "このニックネームは既に使われています。" }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO users (nickname, password, secret_word)
      VALUES (${nickname}, ${hashedPassword}, ${secretWord})
      RETURNING id
    `;
    const userId = rows[0].id;

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
