import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const lastSubmissions = await sql`
      SELECT machine_id, MAX(ticket_number) as last_number
      FROM ticket_submissions
      GROUP BY machine_id
    `;
    
    const results = {
      1: lastSubmissions.rows.find(r => r.machine_id === 1)?.last_number || 0,
      2: lastSubmissions.rows.find(r => r.machine_id === 2)?.last_number || 0
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET Last Numbers Error:", error);
    return NextResponse.json({ error: "最新データの取得に失敗しました。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { ticket_number, date, time, price, force = false } = data;
    
    if (!ticket_number) {
      return NextResponse.json({ error: "食券番号を入力してください。" }, { status: 400 });
    }

    // Determine machine_id from the first digit (1 or 2)
    const ticketStr = ticket_number.toString();
    let machine_id = 0;
    if (ticketStr.startsWith('1')) machine_id = 1;
    else if (ticketStr.startsWith('2')) machine_id = 2;
    else {
      return NextResponse.json({ error: "無効な食券番号です。1または2から始まる番号を入力してください。" }, { status: 400 });
    }

    const sessionId = req.cookies.get('gakushoku_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "セッションがありません。ログインし直してください。" }, { status: 401 });
    }
    const userId = Number(sessionId);

    // 1. Check for duplicates (same machine and ticket number)
    const existing = await sql`
      SELECT id FROM ticket_submissions 
      WHERE machine_id = ${machine_id} AND ticket_number = ${ticket_number}
    `;
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "この食券番号は既に登録されています。" }, { status: 400 });
    }

    // 2. Check for large fluctuations
    const lastResult = await sql`
      SELECT MAX(ticket_number) as last_number FROM ticket_submissions 
      WHERE machine_id = ${machine_id}
    `;
    const lastNumber = lastResult.rows[0]?.last_number || 0;
    
    // Jump threshold (Increased for university context)
    const MAX_JUMP = 1000;
    if (!force && lastNumber > 0 && (ticket_number > lastNumber + MAX_JUMP || ticket_number < lastNumber)) {
      if (ticket_number > lastNumber + MAX_JUMP) {
         return NextResponse.json({ 
           warning: true, 
           error: `${machine_id}号機の前回の番号(${lastNumber})から大きく離れています。本当によろしいですか？` 
         }, { status: 200 });
      }
    }

    // 3. Register submission
    await sql`
      INSERT INTO ticket_submissions (user_id, machine_id, ticket_number, status)
      VALUES (${userId}, ${machine_id}, ${ticket_number}, 'pending')
    `;

    // 4. Update history and user stamps
    // Use user-provided date/time or fallback to server time
    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalTime = time || new Date().toTimeString().split(' ')[0].substring(0, 5);
    const finalPrice = price ? Number(price) : 0;

    await sql`
      INSERT INTO history (user_id, date, time, price, hash) 
      VALUES (${userId}, ${finalDate}, ${finalTime}, ${finalPrice}, ${`M${machine_id}-${ticket_number}`})
    `;
    
    await sql`UPDATE users SET stamps = stamps + 1 WHERE id = ${userId}`;

    return NextResponse.json({ 
      success: true, 
      message: `${machine_id}号機として登録しました`,
    });

  } catch (error) {
    console.error("Stamp Error:", error);
    return NextResponse.json({ error: "スタンプ処理中にエラーが発生しました。" }, { status: 500 });
  }
}
