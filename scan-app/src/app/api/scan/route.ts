import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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
    
    // --- 【新機能】真贋判定：ピクセル統計解析 (sharpを使用) ---
    try {
      const stats = await sharp(buffer).stats();
      const grayStats = stats.channels[0]; // グレースケール相当の統計
      
      console.log("[Scan-App] Image Stats - Stdev:", grayStats.stdev);

      // デジタルデータの場合、背景が完全に均一（stdevが極めて小さい）になる
      // 実写の場合、センサーノイズで必ず一定のばらつき(通常 5.0以上)が出る
      if (grayStats.stdev < 1.0) {
        return NextResponse.json({ 
          error: "偽造の疑い：デジタル作成された画像（スクリーンショット等）の可能性があります。現物の食券をカメラで直接撮影してください。" 
        }, { status: 400 });
      }
    } catch (sharpError) {
      console.error("[Scan-App] Sharp Analysis Failed:", sharpError);
      // 解析不能な場合も安全のためスルーするがログは残す
    }

    let text = "";
    let visionData: any = null;

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

      visionData = await response.json();
      
      if (visionData.error) {
        throw new Error(visionData.error.message || "Vision API Error");
      }

      if (visionData.responses && visionData.responses[0].fullTextAnnotation) {
        text = visionData.responses[0].fullTextAnnotation.text;
        
        // --- 厳格な食券判定 (初期段階) ---
        const hasSomeValidText = text.includes('￥') || text.includes('¥') || text.includes('\\') || text.includes('食堂') || text.includes('高専');
        const hasDate = /(\d{2})\s*[\.\-/_]/.test(text);
        const hasTime = /(\d{1,2})\s*[:：]\s*(\d{2})/.test(text);
        
        // これらが揃っていない場合は食券ではないと判断して早期リターン
        if (!hasSomeValidText || !hasDate || !hasTime) {
           throw new Error("有効な食券が確認できません。食券全体が写るように、明るい場所でもう一度撮影してください。");
        }

        // --- 【新機能】偽造検知：編集記号の検知 ---
        const hasEditingMarks = text.includes('←') || text.includes('↵') || text.includes('←-') || text.includes('<-') || text.includes('^');
        if (hasEditingMarks) {
          throw new Error("偽造の疑い：デジタル編集記号（Word等）が検出されました。本物の食券を使用してください。");
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

    // --- 【新機能】偽造検知：ブラックリストID ---
    const blacklistedIds = ["114514", "123456", "000000", "999999"];
    if (blacklistedIds.includes(finalHash)) {
       return NextResponse.json({ 
         error: "偽造の疑い：この食券IDは無効です。本物の食券を使用してください。" 
       }, { status: 400 });
    }

    // 5. 店舗名の確認 (偽造防止の基礎)
    const isStationValid = text.includes('北九州') || text.includes('高専') || text.includes('食堂');

    // --- 座標情報の抽出 (画像上の位置を特定) ---
    const detectedBoxes: any[] = [];
    const fullAnnotation = visionData?.responses?.[0]?.fullTextAnnotation;
    
    // ヘルパー: 特定の検索結果に一致するブロックの座標を探す
    const findBoxFor = (label: string, value: string | number) => {
      if (!fullAnnotation || !value) return;
      const searchStr = String(value).replace(/[:\.\s]/g, '');
      
      for (const page of fullAnnotation.pages) {
        for (const block of page.blocks) {
          const blockText = block.paragraphs.map((p: any) => p.words.map((w: any) => w.symbols.map((s: any) => s.text).join('')).join('')).join('');
          const cleanBlockText = blockText.replace(/[:\.\s]/g, '');
          
          if (cleanBlockText.includes(searchStr) || searchStr.includes(cleanBlockText)) {
            const v = block.boundingBox.vertices;
            // 座標をパーセンテージに変換 (0-100)
            // Vision APIがwidth/heightを返さないため、verticesから算出
            const xMin = Math.min(...v.map((p: any) => p.x || 0));
            const yMin = Math.min(...v.map((p: any) => p.y || 0));
            const xMax = Math.max(...v.map((p: any) => p.x || 0));
            const yMax = Math.max(...v.map((p: any) => p.y || 0));
            
            // 画像の実際のサイズを取得（sharpなどで取得も可能だが、VisionAPIのverticesの最大値から推測）
            // 通常は正規化された座標(0-1)を使うのが安全
            detectedBoxes.push({
              label,
              x: xMin,
              y: yMin,
              w: xMax - xMin,
              h: yMax - yMin,
              // 正規化用：ページの幅・高さ
              pageW: page.width,
              pageH: page.height
            });
            break; 
          }
        }
      }
    };

    findBoxFor("日付", extractedDate);
    findBoxFor("時間", extractedTime);
    findBoxFor("価格", extractedPrice);
    findBoxFor("ID", finalHash);

    // --- 厳格なバリデーションチェック ---
    const isDateFound = !!dateMatch;
    const isTimeFound = allTimes.length > 0;
    const isPriceFound = priceMatches.length > 0 && prices.length > 0;
    const isIdFound = allCandidateIds.length > 0;
    const isStationFound = isStationValid;

    if (!isDateFound || !isTimeFound || !isPriceFound || !isIdFound || !isStationFound) {
      let missingParts = [];
      if (!isDateFound) missingParts.push("日付");
      if (!isTimeFound) missingParts.push("時刻");
      if (!isPriceFound) missingParts.push("価格");
      if (!isIdFound) missingParts.push("食券ID");
      if (!isStationFound) missingParts.push("店舗情報(北九州高専)");

      return NextResponse.json({ 
        error: `食券の判別に必要な情報が不足しています（不足: ${missingParts.join(", ")}）。明るい場所で、全ての文字がはっきり写るように撮影してください。` 
      }, { status: 400 });
    }

    const extractedData = {
      date: extractedDate,
      time: extractedTime,
      price: extractedPrice,
      hash: finalHash,
      isVisionActive: true,
      shopInfo: isStationValid ? "北九州高専 食堂" : "不明な店舗",
      boxes: detectedBoxes
    };

    return NextResponse.json({ 
      success: true, 
      message: "解析完了",
      data: extractedData
    });

  } catch (error) {
    console.error("[Scan-App] OCR Error:", error);
    return NextResponse.json({ error: "画像解析中にエラーが発生しました。" }, { status: 500 });
  }
}
