import { NextRequest, NextResponse } from "next/server";

// 簡易的な重複チェック用の一時データストア
const usedHashes = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data || !data.hash) {
      return NextResponse.json({ error: "無効なデータです。" }, { status: 400 });
    }

    // 重複利用チェック
    if (usedHashes.has(data.hash)) {
      return NextResponse.json({ error: "この食券IDは既に利用されているため、登録できません。" }, { status: 400 });
    }

    // 登録成功
    usedHashes.add(data.hash);

    // 金額に応じたスタンプ付与ロジック等（必要に応じて）
    return NextResponse.json({ 
      success: true, 
      message: "スタンプを付与しました",
    });

  } catch (error) {
    console.error("Stamp Error:", error);
    return NextResponse.json({ error: "スタンプ処理中にエラーが発生しました。" }, { status: 500 });
  }
}
