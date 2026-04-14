import { NextRequest, NextResponse } from "next/server";

// ユーザーから提供されたAPIキー
const GOOGLE_VISION_API_KEY = "AIzaSyA07pFgh_i_jZIAngMtHLw4dZyON2RoNsA";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    
    let text = "";

    try {
      console.log("[Scan-App] Calling Google Cloud Vision API...");
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      });

      const visionData = await response.json();
      
      if (visionData.error) {
        throw new Error(visionData.error.message || "Vision API Error");
      }

      if (visionData.responses && visionData.responses[0].fullTextAnnotation) {
        text = visionData.responses[0].fullTextAnnotation.text;
        
        // --- 偽造防止ロジックのベース（ここに今後追加していく） ---
        const hasNumber = /\d+/.test(text);
        const hasSomeValidText = text.includes('￥') || text.includes('¥') || text.includes('円') || text.includes('食堂') || text.includes('高専');
        
        if (!hasNumber || !hasSomeValidText) {
           throw new Error("食券のフォーマットが確認できません。もう少し明るい場所で撮影してください。");
        }
      } else {
        text = "";
      }
    } catch (visionError: any) {
      console.error("[Scan-App] Vision API Request Failed:", visionError);
      return NextResponse.json({ error: `解析エラー: ${visionError.message}` }, { status: 500 });
    }

    // --- 高度なデータ抽出ロジック (北九州高専レイアウト特化) ---
    const lines = text.split('\n');
    console.log("[Scan-App] Raw OCR Text lines:", lines);

    // 1. 日付の抽出 (例: 26. -4. 10)
    // パターン: YY . -M . DD または YY . M . DD (記号やスペースを許容)
    const datePattern = /(\d{2})\s*[\.\-/_]\s*(\-?\s*\d{1,2})\s*[\.\-/_]\s*(\d{1,2})/;
    const dateMatch = text.match(datePattern);
    let extractedDate = "";
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].replace(/[-\s]/g, '').padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      extractedDate = `${year}.${month}.${day}`;
    } else {
      extractedDate = new Date().toLocaleDateString('ja-JP').substring(2).replace(/\//g, '. ');
    }

    // 2. 時刻の抽出 (例: 11:42)
    // 複数の時刻がある場合、「オーダーストップ」等のキーワードが含まれる行を除外して探す
    const timePattern = /(\d{1,2})\s*[:：]\s*(\d{2})/g;
    const allTimes = [...text.matchAll(timePattern)];
    let extractedTime = "";
    
    if (allTimes.length > 0) {
      // 「ーダーストップ」という単語が含まれる行の時刻を除外候補にする
      const validTimes = allTimes.filter(match => {
        const lineWithTime = lines.find(l => l.includes(match[0]));
        return !lineWithTime?.includes('タップ') && !lineWithTime?.includes('トップ');
      });
      
      const targetMatch = validTimes.length > 0 ? validTimes[validTimes.length - 1] : allTimes[allTimes.length - 1];
      extractedTime = `${targetMatch[1].padStart(2, '0')}:${targetMatch[2]}`;
    } else {
      extractedTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }

    // 3. 価格の抽出 (例: \ 5 0 0)
    // ¥記号や\記号（誤認）の後の数字を取得。改行を跨がないように [ \t] を使用。
    const priceMatches = text.match(/[¥￥\\][ \t]*([\d \t,]+)/g) || [];
    let extractedPrice = 450;
    if (priceMatches.length > 0) {
      const prices = priceMatches.map(p => {
        const val = p.replace(/[¥￥\\\s,]/g, '');
        return parseInt(val, 10);
      }).filter(n => !isNaN(n) && n > 0 && n <= 999); // 1000円以上は誤認として除外
      
      if (prices.length > 0) {
        // 最大の値を価格として採用
        extractedPrice = Math.max(...prices);
      }
    }

    // 4. 食券ID (Hash) の抽出 (例: 183207)
    // 右上に配置されることが多い6桁の独立した数字
    const idPattern = /\b\d{6}\b/g;
    const allCandidateIds = text.match(idPattern) || [];
    const finalHash = allCandidateIds.find(h => {
      // 価格や日付に含まれているものは除外
      const isPrice = String(extractedPrice).includes(h);
      const isDatePart = extractedDate.includes(h);
      return !isPrice && !isDatePart;
    }) || (allCandidateIds.length > 0 ? allCandidateIds[0] : String(Math.floor(Math.random() * 900000) + 100000));

    // 5. 店舗名の確認 (偽造防止の基礎)
    const isStationValid = text.includes('北九州') || text.includes('高専') || text.includes('食堂');

    const extractedData = {
      date: extractedDate,
      time: extractedTime,
      price: extractedPrice,
      hash: finalHash,
      isVisionActive: true,
      shopInfo: isStationValid ? "北九州高専 食堂" : "不明な店舗"
    };

    return NextResponse.json({ 
      success: true, 
      message: isStationValid ? "解析完了" : "注意: 指定店舗の文字が確認できません",
      data: extractedData
    });

  } catch (error) {
    console.error("[Scan-App] OCR Error:", error);
    return NextResponse.json({ error: "画像解析中にエラーが発生しました。" }, { status: 500 });
  }
}
