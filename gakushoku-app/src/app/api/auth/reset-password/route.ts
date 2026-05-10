import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nickname, secretWord, newPassword } = await req.json();

    if (!nickname || !secretWord || !newPassword) {
      return NextResponse.json({ error: "すべての項目を入力してください。" }, { status: 400 });
    }

    const { rows } = await sql`SELECT id, secret_word FROM users WHERE nickname = ${nickname}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    if (user.secret_word !== secretWord) {
      return NextResponse.json({ error: "秘密の言葉が正しくありません。" }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashedNewPassword} WHERE id = ${user.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "パスワードのリセット中にエラーが発生しました。" }, { status: 500 });
  }
}
