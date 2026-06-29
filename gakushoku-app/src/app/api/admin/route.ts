import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get("x-admin-password");
  return authHeader === ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = req.nextUrl.searchParams.get("tab") || "ホーム";

  try {
    switch (tab) {
      case "ホーム": {
        const usersResult = await sql`SELECT * FROM users ORDER BY id DESC`;
        const countsResult = await sql`
          SELECT 
            (SELECT COUNT(*) FROM used_hashes) as hash_count,
            (SELECT COUNT(*) FROM used_hashes WHERE created_at >= CURRENT_DATE) as today_hash_count,
            (SELECT COUNT(*) FROM menu_items) as menu_count,
            (SELECT COUNT(*) FROM history) as history_count
        `;
        return NextResponse.json({
          users: usersResult.rows,
          counts: {
            users: usersResult.rows.length,
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
        const usersResult = await sql`SELECT id, nickname, stamps, tickets FROM users ORDER BY id DESC`;
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
        const users = await sql`SELECT id, nickname FROM users ORDER BY id DESC`;
        return NextResponse.json({ submissions: submissions.rows, users: users.rows });
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

        const eligibleResult = await sql`SELECT id, tickets FROM users WHERE tickets > 0`;
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
        
        await sql`UPDATE users SET tickets = 0`;
        return NextResponse.json({ success: true, winners: Array.from(winners) });
      }

      case "deleteUser": {
        const { id } = body;
        await sql`DELETE FROM history WHERE user_id = ${Number(id)}`;
        await sql`DELETE FROM used_hashes WHERE user_id = ${Number(id)}`;
        await sql`DELETE FROM users WHERE id = ${Number(id)}`;
        return NextResponse.json({ success: true });
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
