import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('gakushoku_session')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get notifications (global + targeted to this user)
    // and check read status
    const { rows: notifications } = await sql`
      SELECT 
        n.*,
        CASE WHEN nr.read_at IS NOT NULL THEN true ELSE false END as is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ${Number(userId)}
      WHERE n.is_global = true OR n.target_user_id = ${Number(userId)}
      ORDER BY n.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ error: "通知の取得に失敗しました。" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('gakushoku_session')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notificationId } = await req.json();

    if (action === "markAsRead") {
      await sql`
        INSERT INTO notification_reads (user_id, notification_id)
        VALUES (${Number(userId)}, ${Number(notificationId)})
        ON CONFLICT (user_id, notification_id) DO NOTHING
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notifications POST Error:", error);
    return NextResponse.json({ error: "処理に失敗しました。" }, { status: 500 });
  }
}
