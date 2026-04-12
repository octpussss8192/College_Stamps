import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

// 簡易的な重複チェック用の一時データストア (Demo Mode)
const usedHashesFallback = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data || !data.hash) {
      return NextResponse.json({ error: "無効なデータです。" }, { status: 400 });
    }

    const sessionId = req.cookies.get('gakushoku_session')?.value;
    const isReleaseMode = !!sessionId;

    if (isReleaseMode) {
      // Release Mode: Use Database
      try {
        const existing = await sql`SELECT hash FROM used_hashes WHERE hash = ${data.hash}`;
        if ((existing.rowCount ?? 0) > 0) {
           throw new Error("USED");
        }
        
        await sql`INSERT INTO used_hashes (hash, user_id) VALUES (${data.hash}, ${Number(sessionId)})`;
        
        await sql`
          INSERT INTO history (user_id, date, time, price, hash) 
          VALUES (${Number(sessionId)}, ${data.date}, ${data.time}, ${data.price}, ${data.hash})
        `;
        
        const stampsToAdd = 1;
        await sql`UPDATE users SET stamps = stamps + ${stampsToAdd} WHERE id = ${Number(sessionId)}`;
        
      } catch (dbErr: any) {
        if (dbErr.message === "USED" || dbErr.code === '23505') { // Postgres unique constraint violation
          return NextResponse.json({ error: "この食券IDは既に利用されているため、登録できません。" }, { status: 400 });
        }
        throw dbErr;
      }
    } else {
      // Demo Mode: Use Memory
      if (usedHashesFallback.has(data.hash)) {
        return NextResponse.json({ error: "この食券IDは既に利用されているため、登録できません。" }, { status: 400 });
      }
      usedHashesFallback.add(data.hash);
    }

    return NextResponse.json({ 
      success: true, 
      message: "スタンプを付与しました",
    });

  } catch (error) {
    console.error("Stamp Error:", error);
    return NextResponse.json({ error: "スタンプ処理中にエラーが発生しました。" }, { status: 500 });
  }
}
