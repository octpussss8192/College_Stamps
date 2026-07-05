This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## メール認証の設定 (Resend)

リリース版モードで動作させる場合、ユーザー登録やパスワード再設定のメール認証機能が必要です。
本プロジェクトでは **Resend** の SMTP サーバーを利用してメールを配信します。

### セットアップ手順

1. **`.env.local` の作成**
   プロジェクトのルート（`gakushoku-app/` 直下）に `.env.local` を新規作成し、以下の内容を記述します。
   ```env
   # Resend SMTP 設定
   SMTP_HOST="smtp.resend.com"
   SMTP_PORT=587
   SMTP_USER="resend"
   SMTP_PASS="あなたのResend APIキー (re_xxxxx)"
   SMTP_FROM='"学食スタンプ" <onboarding@resend.dev>'
   ```

2. **Resend APIキーの取得**
   - [Resend (resend.com)](https://resend.com/) で無料アカウントを作成します。
   - 「API Keys」メニューからキーを作成し、`SMTP_PASS` に貼り付けます。

3. **ドメイン未設定時の制限事項**
   Resendで独自ドメインを設定していない場合は、以下の制限がかかります。
   - **送信先（宛先）**: **Resendのアカウント作成に使用したあなたのメールアドレス宛にしかメールを送信できません。**
   - **送信元（差出人）**: 送信元 `SMTP_FROM` には `"学食スタンプ" <onboarding@resend.dev>` を指定する必要があります。
   - テストする際は、必ずResendに登録したメールアドレスを使用してアカウント登録や認証コードの再送信を行ってください。

### 開発用デバッグモードの切り替え

- **SMTP環境変数が設定されていない場合**：
  開発環境（`npm run dev`）では、画面上にデバッグ用コード（`[DEV CODE] 123456` など）が直接表示され、実メールを送らなくてもテストできます。
- **SMTP環境変数が正しく設定されている場合**：
  開発環境であっても画面上のデバッグ表示は消え、本番同様に実際に届いたメールのコードを入力するフローになります。

