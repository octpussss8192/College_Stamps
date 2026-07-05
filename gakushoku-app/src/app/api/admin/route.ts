import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { sendEmail, isSmtpConfigured } from "@/lib/mail";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

// 20日以上前の論理削除ユーザーをクリーンアップする関数
async function cleanupDeletedUsers() {
  try {
    const { rows: expiredUsers } = await sql`
      SELECT id FROM users 
      WHERE deleted_at < NOW() - INTERVAL '20 days'
    `;
    
    for (const u of expiredUsers) {
      await sql`DELETE FROM ticket_history WHERE user_id = ${u.id}`;
      await sql`DELETE FROM ticket_submissions WHERE user_id = ${u.id}`;
      await sql`DELETE FROM history WHERE user_id = ${u.id}`;
      await sql`DELETE FROM used_hashes WHERE user_id = ${u.id}`;
      await sql`DELETE FROM notification_reads WHERE user_id = ${u.id}`;
      await sql`DELETE FROM lottery_winners WHERE user_id = ${u.id}`;
      await sql`DELETE FROM users WHERE id = ${u.id}`;
    }
    if (expiredUsers.length > 0) {
      console.log(`Cleaned up ${expiredUsers.length} expired users.`);
    }
  } catch (err) {
    console.error("Cleanup deleted users failed:", err);
  }
}

function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  return authHeader === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // バックグラウンドで自動クリーンアップを走らせる
  cleanupDeletedUsers().catch(err => console.error(err));

  const tab = req.nextUrl.searchParams.get("tab") || "ホーム";

  try {
    switch (tab) {
      case "ホーム": {
        const activeUsers = await sql`SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id DESC`;
        const trashUsers = await sql`SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY id DESC`;
        const countsResult = await sql`
          SELECT 
            (SELECT COUNT(*) FROM used_hashes) as hash_count,
            (SELECT COUNT(*) FROM used_hashes WHERE created_at >= CURRENT_DATE) as today_hash_count,
            (SELECT COUNT(*) FROM menu_items) as menu_count,
            (SELECT COUNT(*) FROM history) as history_count
        `;
        return NextResponse.json({
          users: activeUsers.rows,
          trashUsers: trashUsers.rows,
          counts: {
            users: activeUsers.rows.length,
            trashUsers: trashUsers.rows.length,
            hashes: Number(countsResult.rows[0]?.hash_count || 0),
            today_hashes: Number(countsResult.rows[0]?.today_hash_count || 0),
            menus: Number(countsResult.rows[0]?.menu_count || 0),
            history: Number(countsResult.rows[0]?.history_count || 0),
          }
        });
      }

      case "メニュー": {
        const menusResult = await sql`SELECT * FROM menu_items ORDER BY id DESC`;
        return NextResponse.json({ menus: menusResult.rows });
      }

      case "特典": {
        const usersResult = await sql`SELECT id, nickname, stamps, tickets FROM users WHERE deleted_at IS NULL ORDER BY id DESC`;
        const winnersResult = await sql`
          SELECT lw.*, u.nickname 
          FROM lottery_winners lw 
          JOIN users u ON lw.user_id = u.id 
          ORDER BY lw.created_at DESC
        `;
        return NextResponse.json({ users: usersResult.rows, winners: winnersResult.rows });
      }

      case "履歴": {
        const historyResult = await sql`SELECT * FROM history ORDER BY created_at DESC LIMIT 100`;
        return NextResponse.json({ history: historyResult.rows });
      }

      case "食券ログ": {
        const submissions = await sql`SELECT * FROM ticket_submissions ORDER BY created_at DESC LIMIT 100`;
        const users = await sql`SELECT id, nickname FROM users WHERE deleted_at IS NULL ORDER BY id DESC`;
        return NextResponse.json({ submissions: submissions.rows, users: users.rows });
      }

      case "通知": {
        const notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
        return NextResponse.json({ notifications: notifications.rows });
      }

      case "レポート": {
        // 日別食券機ログ件数（過去30日）
        const dayLogs = await sql`
          SELECT TO_CHAR(ticket_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
          FROM ticket_machine_logs 
          WHERE ticket_at >= CURRENT_DATE - INTERVAL '30 days' 
          GROUP BY TO_CHAR(ticket_at, 'YYYY-MM-DD') 
          ORDER BY date ASC
        `;
        // 日別アプリ照合完了件数（過去30日）
        const daySubmissions = await sql`
          SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count 
          FROM ticket_submissions 
          WHERE status = 'verified' AND created_at >= CURRENT_DATE - INTERVAL '30 days' 
          GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
          ORDER BY date ASC
        `;
        // 月別食券機ログ件数（過去12ヶ月）
        const monthLogs = await sql`
          SELECT TO_CHAR(ticket_at, 'YYYY-MM') as month, COUNT(*) as count 
          FROM ticket_machine_logs 
          WHERE ticket_at >= CURRENT_DATE - INTERVAL '12 months' 
          GROUP BY TO_CHAR(ticket_at, 'YYYY-MM') 
          ORDER BY month ASC
        `;
        // 月別アプリ照合完了件数（過去12ヶ月）
        const monthSubmissions = await sql`
          SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count 
          FROM ticket_submissions 
          WHERE status = 'verified' AND created_at >= CURRENT_DATE - INTERVAL '12 months' 
          GROUP BY TO_CHAR(created_at, 'YYYY-MM') 
          ORDER BY month ASC
        `;

        return NextResponse.json({
          dayLogs: dayLogs.rows,
          daySubmissions: daySubmissions.rows,
          monthLogs: monthLogs.rows,
          monthSubmissions: monthSubmissions.rows
        });
      }

      case "システム": {
        return NextResponse.json({ 
          smtpConfigured: isSmtpConfigured(),
          smtpUser: process.env.SMTP_USER || null
        });
      }

      default:
        return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // バックグラウンドで自動クリーンアップを走らせる
  cleanupDeletedUsers().catch(err => console.error(err));

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "importTicketLogs": {
        const csv = body.csv as string;
        if (!csv) return NextResponse.json({ error: "CSVデータがありません" }, { status: 400 });

        const lines = csv.split('\n');
        let importedCount = 0;

        for (const line of lines) {
          const [mId, tNum, tAt] = line.split(',').map((s: string) => s.trim());
          if (!mId || !tNum || !tAt) continue;

          try {
            await sql`
              INSERT INTO ticket_machine_logs (machine_id, ticket_number, ticket_at)
              VALUES (${Number(mId)}, ${Number(tNum)}, ${tAt})
              ON CONFLICT (machine_id, ticket_number, ticket_at) DO NOTHING
            `;
            importedCount++;
          } catch (e) {
            console.warn("Skip log line error:", e);
          }
        }

        // Run Verification
        const pendingSubmissions = await sql`SELECT * FROM ticket_submissions WHERE status = 'pending'`;
        for (const sub of pendingSubmissions.rows) {
          const match = await sql`
            SELECT id FROM ticket_machine_logs 
            WHERE machine_id = ${sub.machine_id} AND ticket_number = ${sub.ticket_number}
          `;
          if (match.rowCount && match.rowCount > 0) {
            await sql`UPDATE ticket_submissions SET status = 'verified' WHERE id = ${sub.id}`;
          } else {
            // If it's been more than 24 hours and still no match, mark as invalid
            const ageHours = (new Date().getTime() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60);
            if (ageHours > 24) {
              await sql`UPDATE ticket_submissions SET status = 'invalid' WHERE id = ${sub.id}`;
            }
          }
        }

        return NextResponse.json({ success: true, message: `${importedCount}件インポートしました。照合を完了しました。` });
      }

      case "deleteSubmission": {
        const { id } = body;
        await sql`DELETE FROM ticket_submissions WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true });
      }

      case "runLottery": {
        const date = new Date();
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = await sql`SELECT * FROM lottery_winners WHERE month = ${month}`;
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: "今月の抽選は既に実行済みです" }, { status: 400 });
        }

        // Calculate winners
        const hashesResult = await sql`
          SELECT created_at, user_id
          FROM used_hashes
          WHERE TO_CHAR(created_at, 'YYYY-MM') = ${month}
        `;
        const daysMap = new Map<string, Set<number>>();
        hashesResult.rows.forEach(r => {
          const dStr = new Date(r.created_at).toISOString().split('T')[0];
          if (!daysMap.has(dStr)) daysMap.set(dStr, new Set());
          daysMap.get(dStr)!.add(r.user_id);
        });

        let extra = 0;
        daysMap.forEach(usersSet => {
          if (usersSet.size > 70) extra++;
        });

        const [yearStr, monthStr] = month.split('-');
        const yearNum = Number(yearStr);
        const monthNum = Number(monthStr);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(yearNum, monthNum - 1, d);
          if (dateObj.getDay() === 1) { // Monday
            let allOver70 = true;
            for (let i = 0; i < 5; i++) {
              const checkDate = new Date(yearNum, monthNum - 1, d + i);
              const dateStr = checkDate.toISOString().split('T')[0];
              if (!daysMap.has(dateStr) || daysMap.get(dateStr)!.size <= 70) {
                allOver70 = false;
                break;
              }
            }
            if (allOver70) extra++;
          }
        }

        const winnersCount = Math.min(2 + extra, 5);

        const eligibleResult = await sql`SELECT id, tickets FROM users WHERE tickets > 0 AND deleted_at IS NULL`;
        const pool: number[] = [];
        eligibleResult.rows.forEach(u => {
          for (let i = 0; i < u.tickets; i++) pool.push(u.id);
        });

        if (pool.length === 0) {
          return NextResponse.json({ error: "抽選券を持っているユーザーがいません" }, { status: 400 });
        }

        const winners = new Set<number>();
        let attempts = 0;
        while (winners.size < winnersCount && winners.size < eligibleResult.rows.length && attempts < 1000) {
          winners.add(pool[Math.floor(Math.random() * pool.length)]);
          attempts++;
        }

        for (const wid of winners) {
          await sql`INSERT INTO lottery_winners (month, user_id) VALUES (${month}, ${wid})`;
        }
        
        await sql`UPDATE users SET tickets = 0 WHERE deleted_at IS NULL`;
        return NextResponse.json({ success: true, winners: Array.from(winners) });
      }

      case "deleteUser": {
        // 論理削除（ゴミ箱へ移動）
        const { id } = body;
        await sql`UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true, message: "ユーザーをゴミ箱に移動しました。" });
      }

      case "restoreUser": {
        // 論理削除から復元
        const { id } = body;
        await sql`UPDATE users SET deleted_at = NULL WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true, message: "ユーザーを復元しました。" });
      }

      case "forceDeleteUser": {
        // 物理削除
        const { id } = body;
        const uId = Number(id);
        await sql`DELETE FROM ticket_history WHERE user_id = ${uId}`;
        await sql`DELETE FROM ticket_submissions WHERE user_id = ${uId}`;
        await sql`DELETE FROM history WHERE user_id = ${uId}`;
        await sql`DELETE FROM used_hashes WHERE user_id = ${uId}`;
        await sql`DELETE FROM notification_reads WHERE user_id = ${uId}`;
        await sql`DELETE FROM lottery_winners WHERE user_id = ${uId}`;
        await sql`DELETE FROM users WHERE id = ${uId}`;
        return NextResponse.json({ success: true, message: "ユーザーを完全に削除しました。" });
      }

      case "addSubmissionManual": {
        const { machine_id, ticket_number, user_id } = body;
        const mId = Number(machine_id);
        const tNum = Number(ticket_number);
        const uId = Number(user_id);

        // 1. Register submission as verified
        await sql`
          INSERT INTO ticket_submissions (user_id, machine_id, ticket_number, status)
          VALUES (${uId}, ${mId}, ${tNum}, 'verified')
        `;

        // 2. Update history and user stamps
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        await sql`
          INSERT INTO history (user_id, date, time, price, hash) 
          VALUES (${uId}, ${dateStr}, ${timeStr}, 0, ${`MANUAL-${mId}-${tNum}`})
        `;
        
        await sql`UPDATE users SET stamps = stamps + 1 WHERE id = ${uId}`;
        
        return NextResponse.json({ success: true });
      }

      case "deleteMenu": {
        const { id } = body;
        await sql`DELETE FROM menu_items WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true });
      }

      case "addMenu": {
        const { name, description, price, isSpecial, dayOfWeek, imageUrl } = body;
        if (isSpecial) {
          await sql`UPDATE menu_items SET is_today_special = false WHERE day_of_week IS NULL`;
        }
        await sql`INSERT INTO menu_items (name, description, price, is_today_special, day_of_week, image_url) VALUES (${name}, ${description || ''}, ${price ? Number(price) : null}, ${!!isSpecial}, ${dayOfWeek || null}, ${imageUrl || null})`;
        return NextResponse.json({ success: true });
      }

      case "updateStamps": {
        const { userId, stamps, tickets } = body;
        if (tickets !== undefined) {
          await sql`UPDATE users SET stamps = ${Number(stamps)}, tickets = ${Number(tickets)} WHERE id = ${Number(userId)}`;
        } else {
          await sql`UPDATE users SET stamps = ${Number(stamps)} WHERE id = ${Number(userId)}`;
        }
        return NextResponse.json({ success: true });
      }

      case "updateStampsBulk": {
        const { changes } = body;
        if (!changes || !Array.isArray(changes)) {
          return NextResponse.json({ error: "変更データが不正です。" }, { status: 400 });
        }
        for (const c of changes) {
          await sql`
            UPDATE users 
            SET stamps = ${Number(c.stamps)}, tickets = ${Number(c.tickets)} 
            WHERE id = ${Number(c.userId)}
          `;
        }
        return NextResponse.json({ success: true, message: `${changes.length}件の変更を保存しました。` });
      }

      case "addNotification": {
        const { title, content, type } = body;
        if (!title || !content) return NextResponse.json({ error: "件名と内容を入力してください。" }, { status: 400 });
        await sql`
          INSERT INTO notifications (title, content, type, is_global)
          VALUES (${title}, ${content}, ${type || 'info'}, true)
        `;
        return NextResponse.json({ success: true, message: "お知らせを配信しました。" });
      }

      case "deleteNotification": {
        const { id } = body;
        const nId = Number(id);
        await sql`DELETE FROM notification_reads WHERE notification_id = ${nId}`;
        await sql`DELETE FROM notifications WHERE id = ${nId}`;
        return NextResponse.json({ success: true });
      }

      case "sendTestEmail": {
        const { to } = body;
        if (!to) return NextResponse.json({ error: "送信先メールアドレスを入力してください。" }, { status: 400 });
        
        const subject = "【学食スタンプ】デバッグ・テストメール";
        const text = "このメールは管理者ダッシュボードから送信されたテストメールです。\n正常にSMTP接続が動作しています。";
        const html = `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 3px solid #18181A; border-radius: 12px; background-color: #FAF7F2;">
            <h2 style="color: #FF5E36; text-align: center; font-size: 24px; border-bottom: 3px solid #18181A; padding-bottom: 10px;">学食スタンプ テストメール</h2>
            <p>このメールは管理者ダッシュボードから送信されたデバッグ用のテストメールです。</p>
            <div style="background-color: #00F5A0; border: 2px solid #18181A; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; font-weight: bold; color: #18181A;">
              SMTP送信テスト 成功
            </div>
            <p style="font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">送信時刻: ${new Date().toLocaleString('ja-JP')}</p>
          </div>
        `;

        const result = await sendEmail({ to, subject, text, html });
        return NextResponse.json(result);
      }

      case "seedDummyData": {
        // ダミーユーザーの生成
        const checkUsers = await sql`SELECT id FROM users LIMIT 1`;
        if (checkUsers.rowCount === 0) {
          const dummyHash = "$2a$10$Q7eYh4oF2Uv9/VdDfsjYVem5C8B4l4vF0P9Vj.Bv9tq2J8P3S3GgK"; 
          await sql`INSERT INTO users (nickname, email, password, secret_word, stamps, tickets, email_verified) VALUES ('テスト高専生', 'test-student@saba2saba.kosen', ${dummyHash}, 'ラーメン', 5, 2, true)`;
          await sql`INSERT INTO users (nickname, email, password, secret_word, stamps, tickets, email_verified) VALUES ('学食マスター', 'master-student@saba2saba.kosen', ${dummyHash}, 'カレー', 18, 0, true)`;
        }

        // ダミーメニューの生成
        const checkMenus = await sql`SELECT id FROM menu_items LIMIT 1`;
        if (checkMenus.rowCount === 0) {
          await sql`INSERT INTO menu_items (name, description, price, is_today_special, day_of_week) VALUES ('高専カレー', '定番の味、大盛り無料！', 380, false, null)`;
          await sql`INSERT INTO menu_items (name, description, price, is_today_special, day_of_week) VALUES ('日替わり定食A', '本日は油淋鶏定食です！', 450, true, '月曜日')`;
          await sql`INSERT INTO menu_items (name, description, price, is_today_special, day_of_week) VALUES ('日替わり定食B', '本日はハンバーグ定食！', 480, true, '水曜日')`;
        }

        // 過去30日分の食券機ダミーログおよび登録データのインプット
        const checkLogs = await sql`SELECT id FROM ticket_machine_logs LIMIT 1`;
        if (checkLogs.rowCount === 0) {
          const now = new Date();
          for (let i = 29; i >= 0; i--) {
            const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = logDate.toISOString().split('T')[0];
            
            const dailyLogsCount = Math.floor(Math.random() * 5) + 1;
            for (let j = 0; j < dailyLogsCount; j++) {
              const ticketNum = 183000 + Math.floor(Math.random() * 1000);
              const hour = 11 + Math.floor(Math.random() * 2);
              const min = Math.floor(Math.random() * 60);
              const logTimeStr = `${dateStr} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
              
              await sql`
                INSERT INTO ticket_machine_logs (machine_id, ticket_number, ticket_at)
                VALUES (${Math.floor(Math.random() * 2) + 1}, ${ticketNum}, ${logTimeStr})
                ON CONFLICT (machine_id, ticket_number, ticket_at) DO NOTHING
              `;

              if (Math.random() < 0.7) {
                const users = await sql`SELECT id FROM users LIMIT 1`;
                if (users.rowCount && users.rowCount > 0) {
                  const uId = users.rows[0].id;
                  await sql`
                    INSERT INTO ticket_submissions (user_id, machine_id, ticket_number, status, created_at)
                    VALUES (${uId}, ${Math.floor(Math.random() * 2) + 1}, ${ticketNum}, 'verified', ${logTimeStr})
                  `;
                }
              }
            }
          }
        }

        return NextResponse.json({ success: true, message: "ダミーデータの生成が完了しました。" });
      }

      case "resetDatabase": {
        await sql`DELETE FROM ticket_submissions`;
        await sql`DELETE FROM ticket_machine_logs`;
        await sql`DELETE FROM history`;
        await sql`DELETE FROM used_hashes`;
        await sql`DELETE FROM notification_reads`;
        await sql`DELETE FROM notifications`;
        await sql`DELETE FROM lottery_winners`;
        await sql`DELETE FROM ticket_history`;
        await sql`DELETE FROM users`;
        await sql`DELETE FROM menu_items`;
        return NextResponse.json({ success: true, message: "データベースを初期化しました。" });
      }

      case "verifyPassword": {
        const { password } = body;
        return NextResponse.json({ valid: password === ADMIN_PASSWORD });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
