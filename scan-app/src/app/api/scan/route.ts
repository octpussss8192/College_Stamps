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

    // データ抽出
    const dateMatch = text.match(/\d{2}\s*[\.\/]\s*\d{1,2}\s*[\.\/]\s*\d{1,2}/);
    const timeMatch = text.match(/\d{2}\s*:\s*\d{2}/);
    const priceMatch = text.match(/[￥¥]\s*([0-9,]+)/) || text.match(/([0-9,]+)\s*円/);
    const allCandidateHashes = text.match(/\b\d{6}\b/g) || text.match(/\b\d{4,8}\b/g) || [];
    
    const finalHash = allCandidateHashes.find(h => {
      const isPrice = priceMatch && priceMatch[1].includes(h);
      const isDate = dateMatch && dateMatch[0].includes(h);
      return !isPrice && !isDate;
    }) || (allCandidateHashes.length > 0 ? allCandidateHashes[0] : String(Math.floor(Math.random() * 900000) + 100000));

    const extractedData = {
      date: dateMatch ? dateMatch[0].replace(/\//g, '.') : new Date().toLocaleDateString('ja-JP').substring(2).replace(/\//g, '. '),
      time: timeMatch ? timeMatch[0] : new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      price: priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 450,
      hash: finalHash,
      isVisionActive: true
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
