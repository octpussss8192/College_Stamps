import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "ニックネームとパスワードを入力してください。" }, { status: 400 });
    }

    const { rows } = await sql`SELECT id, password FROM users WHERE nickname = ${nickname}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "ニックネームまたはパスワードが間違っています。" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "ニックネームまたはパスワードが間違っています。" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, userId: user.id, nickname });
    
    response.cookies.set('gakushoku_session', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "ログイン中にエラーが発生しました。" }, { status: 500 });
  }
}
