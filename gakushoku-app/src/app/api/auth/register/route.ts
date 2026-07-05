import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendVerificationEmail, isSmtpConfigured } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { nickname, email, password, secretWord } = await req.json();

    if (!nickname || !email || !password || !secretWord) {
      return NextResponse.json({ error: "すべての項目を入力してください。" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください。" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists (nickname or email)
    const existing = await sql`SELECT id, nickname, email FROM users WHERE (nickname = ${nickname} OR email = ${email}) AND deleted_at IS NULL`;
    if ((existing.rowCount ?? 0) > 0) {
      const existingUser = existing.rows[0];
      if (existingUser.nickname === nickname) {
        return NextResponse.json({ error: "このニックネームは既に使われています。" }, { status: 400 });
      }
      if (existingUser.email === email) {
        return NextResponse.json({ error: "このメールアドレスは既に使われています。" }, { status: 400 });
      }
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { rows } = await sql`
      INSERT INTO users (nickname, email, password, secret_word, email_verified, verification_code, verification_code_expires)
      VALUES (${nickname}, ${email}, ${hashedPassword}, ${secretWord}, FALSE, ${verificationCode}, ${verificationExpires.toISOString()})
      RETURNING id
    `;
    const userId = rows[0].id;

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    // Return verification info
    const responsePayload: any = { success: true, userId, nickname, email };
    
    // In dev mode, return the verification code to easily debug/test
    if (process.env.NODE_ENV !== 'production' && !isSmtpConfigured()) {
      responsePayload.devCode = verificationCode;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "登録中にエラーが発生しました。" }, { status: 500 });
  }
}

