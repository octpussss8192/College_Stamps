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
      console.log("Using Google Cloud Vision API with API Key...");
      
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
      
      // Google API側でエラーが返ってきているかをチェック
      if (visionData.error) {
        console.error("Google Vision API Error:", visionData.error);
        throw new Error(visionData.error.message || "Vision API Keyが無効、またはAPIが有効化されていません。");
      }
      
      if (visionData.responses && visionData.responses[0].fullTextAnnotation) {
        text = visionData.responses[0].fullTextAnnotation.text;
      } else {
        console.warn("Vision API returned empty result:", visionData);
        // 画像に文字が含まれていない場合などは空文字のまま進める
        text = "";
      }
    } catch (visionError: any) {
      console.error("Vision API Request Failed:", visionError);
      return NextResponse.json({ error: `APIエラー: ${visionError.message}` }, { status: 500 });
    }

    console.log("Extracted Text:", text);

    // Simple Regex pattern matching
    const dateMatch = text.match(/\d{2}\s*[\.\/]\s*\d{1,2}\s*[\.\/]\s*\d{1,2}/);
    const timeMatch = text.match(/\d{2}\s*:\s*\d{2}/);
    const priceMatch = text.match(/[￥¥]\s*([0-9,]+)/) || text.match(/([0-9,]+)\s*円/);
    const hashMatch = text.match(/\b\d{4,8}\b/);

    const extractedData = {
      date: dateMatch ? dateMatch[0].replace(/\//g, '.') : new Date().toLocaleDateString('ja-JP').substring(2).replace(/\//g, '. '),
      time: timeMatch ? timeMatch[0] : new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      price: priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 450,
      hash: hashMatch ? hashMatch[0] : String(Math.floor(Math.random() * 900000) + 100000),
      isVisionActive: true
    };

    return NextResponse.json({ 
      success: true, 
      message: "解析完了",
      data: extractedData
    });

  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "画像解析中にエラーが発生しました。" }, { status: 500 });
  }
}
