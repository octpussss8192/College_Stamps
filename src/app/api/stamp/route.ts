import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

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
        db.transaction(() => {
          // Check if hash is used globally or just by this user? Globally for a ticket.
          const checkStmt = db.prepare('SELECT hash FROM used_hashes WHERE hash = ?');
          if (checkStmt.get(data.hash)) {
             throw new Error("USED");
          }
          
          db.prepare('INSERT INTO used_hashes (hash, user_id) VALUES (?, ?)').run(data.hash, Number(sessionId));
          db.prepare('INSERT INTO history (user_id, date, time, price, hash) VALUES (?, ?, ?, ?, ?)').run(
            Number(sessionId), data.date, data.time, data.price, data.hash
          );
          
          const stampsToAdd = Number(data.price) >= 500 ? 2 : 1;
          db.prepare('UPDATE users SET stamps = stamps + ? WHERE id = ?').run(stampsToAdd, Number(sessionId));
        })();
      } catch (dbErr: any) {
        if (dbErr.message === "USED" || dbErr.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
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
