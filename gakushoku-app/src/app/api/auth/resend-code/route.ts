import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json({ error: "ユーザー情報が必要です。" }, { status: 400 });
    }

    let user;
    if (userId) {
      const { rows } = await sql`SELECT id, email, nickname FROM users WHERE id = ${Number(userId)}`;
      user = rows[0];
    } else if (email) {
      const { rows } = await sql`SELECT id, email, nickname FROM users WHERE email = ${email}`;
      user = rows[0];
    }

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません。" }, { status: 404 });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await sql`
      UPDATE users 
      SET verification_code = ${verificationCode}, verification_code_expires = ${verificationExpires.toISOString()} 
      WHERE id = ${user.id}
    `;

    // Send verification email
    await sendVerificationEmail(user.email, verificationCode);

    const responsePayload: any = { success: true, email: user.email };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devCode = verificationCode;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Resend Code Error:", error);
    return NextResponse.json({ error: "コードの再送信中にエラーが発生しました。" }, { status: 500 });
  }
}
