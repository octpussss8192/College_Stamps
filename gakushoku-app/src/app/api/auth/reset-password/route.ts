import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "すべての項目を入力してください。" }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT id, reset_password_code, reset_password_code_expires 
      FROM users 
      WHERE email = ${email}
    `;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    if (!user.reset_password_code || user.reset_password_code !== code) {
      return NextResponse.json({ error: "再設定コードが正しくありません。" }, { status: 401 });
    }

    const expires = new Date(user.reset_password_code_expires);
    if (new Date() > expires) {
      return NextResponse.json({ error: "再設定コードの有効期限が切れています。もう一度最初からやり直してください。" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE users 
      SET password = ${hashedNewPassword}, reset_password_code = NULL, reset_password_code_expires = NULL 
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "パスワードのリセット中にエラーが発生しました。" }, { status: 500 });
  }
}

