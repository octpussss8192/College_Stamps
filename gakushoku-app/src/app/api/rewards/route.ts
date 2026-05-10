import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('gakushoku_session')?.value;
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = Number(sessionId);

    // Fetch entry history
    const historyRes = await sql`SELECT created_at FROM ticket_history WHERE user_id = ${userId} ORDER BY created_at DESC`;
    
    // Fetch wins
    const winsRes = await sql`SELECT month, created_at FROM lottery_winners WHERE user_id = ${userId} ORDER BY created_at DESC`;

    return NextResponse.json({ 
      entries: historyRes.rows,
      wins: winsRes.rows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('gakushoku_session')?.value;
    
    if (!sessionId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = Number(sessionId);

    const { action } = await req.json();

    if (action === "exchangeLotteryTicket") {
      const userRes = await sql`SELECT stamps, tickets FROM users WHERE id = ${userId}`;
      if (userRes.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      const stamps = userRes.rows[0].stamps;
      const tickets = userRes.rows[0].tickets || 0;

      if (stamps < 20) {
        return NextResponse.json({ error: "スタンプが足りません" }, { status: 400 });
      }

      await sql`UPDATE users SET stamps = stamps - 20, tickets = ${tickets + 1} WHERE id = ${userId}`;
      
      // Record in ticket_history
      await sql`INSERT INTO ticket_history (user_id) VALUES (${userId})`;
      
      // Also log it in history
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '.');
      const timeStr = date.toTimeString().substring(0, 5);
      
      await sql`
        INSERT INTO history (user_id, date, time, status)
        VALUES (${userId}, ${dateStr}, ${timeStr}, 'success')
      `;

      return NextResponse.json({ success: true, tickets: tickets + 1 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
