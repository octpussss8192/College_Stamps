import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"学食スタンプ" <no-reply@gakushoku-stamp.local>';

  const isProd = process.env.NODE_ENV === 'production';

  // Check if SMTP is configured
  if (isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Failed to send real email via SMTP to ${to}:`, error);
      throw new Error(`メールの送信に失敗しました: ${(error as Error).message}`);
    }
  }

  // If in production but SMTP is not configured, throw an error
  if (isProd) {
    console.error("SMTP is not configured in production environment.");
    throw new Error("メール送信設定が不足しているため、メールを送信できませんでした。管理者に連絡してください。");
  }

  // Fallback / Development Mock Email Log
  const divider = '='.repeat(60);
  console.log(`
${divider}
[MOCK EMAIL SENT]
To:      ${to}
Subject: ${subject}
Text:    ${text}
${divider}
`);

  return { success: true, mock: true };
}

export async function sendVerificationEmail(email: string, code: string) {
  const subject = '【学食スタンプ】メールアドレス認証コード';
  const text = `学食スタンプアプリをご利用いただきありがとうございます。\n\n以下の認証コードを入力して、登録手続きを完了させてください。\n\n認証コード: ${code}\n\n※有効期限は15分間です。`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px border #e2e8f0; rounded: 12px;">
      <h2 style="color: #2563eb; text-align: center;">学食スタンプ アプリ</h2>
      <p>学食スタンプアプリをご利用いただきありがとうございます。</p>
      <p>以下の認証コードを入力して、登録手続きを完了させてください。</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">※このコードの有効期限は15分間です。</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const subject = '【学食スタンプ】パスワード再設定コード';
  const text = `学食スタンプアプリのパスワード再設定を受け付けました。\n\n以下の再設定コードを入力して、パスワードを変更してください。\n\n再設定コード: ${code}\n\n※有効期限は15分間です。\n※心当たりがない場合は、このメールを破棄してください。`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px border #e2e8f0; rounded: 12px;">
      <h2 style="color: #ef4444; text-align: center;">パスワードの再設定</h2>
      <p>学食スタンプアプリのパスワード再設定を受け付けました。</p>
      <p>以下の再設定コードを入力して、パスワードを変更してください。</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">※このコードの有効期限は15分間です。</p>
      <p style="font-size: 12px; color: #64748b;">※お心当たりがない場合は、このメールを破棄してください。</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}
