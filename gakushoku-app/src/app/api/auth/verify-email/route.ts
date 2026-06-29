import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "ユーザーIDと認証コードを入力してください。" }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT id, nickname, email, verification_code, verification_code_expires 
      FROM users 
      WHERE id = ${Number(userId)}
    `;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    if (!user.verification_code || user.verification_code !== code) {
      return NextResponse.json({ error: "認証コードが正しくありません。" }, { status: 400 });
    }

    const expires = new Date(user.verification_code_expires);
    if (new Date() > expires) {
      return NextResponse.json({ error: "認証コードの有効期限が切れています。再送信してください。" }, { status: 400 });
    }

    // Mark as verified and clear verification code
    await sql`
      UPDATE users 
      SET email_verified = TRUE, verification_code = NULL, verification_code_expires = NULL 
      WHERE id = ${user.id}
    `;

    const response = NextResponse.json({ success: true, userId: user.id, nickname: user.nickname });

    // Set cookie session
    response.cookies.set('gakushoku_session', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json({ error: "メール認証中にエラーが発生しました。" }, { status: 500 });
  }
}
