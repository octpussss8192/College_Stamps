import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 400 });
    }

    const { rows } = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "このメールアドレスで登録されているユーザーは見つかりません。" }, { status: 404 });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await sql`
      UPDATE users 
      SET reset_password_code = ${resetCode}, reset_password_code_expires = ${resetExpires.toISOString()} 
      WHERE id = ${user.id}
    `;

    // Send reset email
    await sendPasswordResetEmail(user.email, resetCode);

    const responsePayload: any = { success: true, email: user.email };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.devCode = resetCode;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "パスワード再設定コードの送信中にエラーが発生しました。" }, { status: 500 });
  }
}
