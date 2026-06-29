import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json({ error: "ログインIDとパスワードを入力してください。" }, { status: 400 });
    }

    // Find user by nickname OR email
    const { rows } = await sql`
      SELECT id, nickname, email, password, email_verified 
      FROM users 
      WHERE nickname = ${nickname} OR email = ${nickname}
    `;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "ユーザー名、メールアドレス、またはパスワードが間違っています。" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "ユーザー名、メールアドレス、またはパスワードが間違っています。" }, { status: 401 });
    }

    // Check if email is verified
    if (user.email_verified === false || user.email_verified === 'false') {
      // Generate a new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await sql`
        UPDATE users 
        SET verification_code = ${verificationCode}, verification_code_expires = ${verificationExpires.toISOString()} 
        WHERE id = ${user.id}
      `;

      // Resend verification email
      await sendVerificationEmail(user.email, verificationCode);

      const responsePayload: any = { 
        error: "メールアドレスが認証されていません。新しい認証コードを送信しました。", 
        emailNotVerified: true, 
        userId: user.id, 
        email: user.email 
      };

      if (process.env.NODE_ENV !== 'production') {
        responsePayload.devCode = verificationCode;
      }

      return NextResponse.json(responsePayload, { status: 403 });
    }

    const response = NextResponse.json({ success: true, userId: user.id, nickname: user.nickname });
    
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

