import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Trash2, Plus, Users, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Prevent caching so we always see fresh data

export default async function AdminPage() {
  let users: any[] = [];
  let hashes: any[] = [];
  let error = null;

  try {
    const usersResult = await sql`SELECT * FROM users ORDER BY id DESC`;
    users = usersResult.rows;

    const hashesResult = await sql`SELECT * FROM used_hashes ORDER BY created_at DESC`;
    hashes = hashesResult.rows;
  } catch (err: any) {
    console.error(err);
    error = err.message;
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const id = formData.get('id');
    try {
      // Delete history and hashes associated with this user first due to foreign keys
      await sql`DELETE FROM history WHERE user_id = ${Number(id)}`;
      await sql`DELETE FROM used_hashes WHERE user_id = ${Number(id)}`;
      await sql`DELETE FROM users WHERE id = ${Number(id)}`;
    } catch (e) {
      console.error(e);
    }
    revalidatePath('/admin');
  }

  async function deleteHash(formData: FormData) {
    "use server";
    const hash = formData.get('hash')?.toString();
    if (!hash) return;
    try {
      await sql`DELETE FROM used_hashes WHERE hash = ${hash}`;
    } catch (e) {
      console.error(e);
    }
    revalidatePath('/admin');
  }

  async function addHash(formData: FormData) {
    "use server";
    const hash = formData.get('hash')?.toString();
    const userId = formData.get('user_id')?.toString();
    if (!hash || !userId) return;
    try {
      await sql`INSERT INTO used_hashes (hash, user_id) VALUES (${hash}, ${Number(userId)})`;
    } catch (e) {
      console.error(e);
    }
    revalidatePath('/admin');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              管理者ダッシュボード
            </h1>
            <p className="text-slate-500 text-sm mt-1">デバッグおよびデータ管理用</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition text-sm">
            トップへ戻る
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            データベースエラー: {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-8">
          {/* USERS SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                登録ユーザー
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {users.length} 人
              </span>
            </div>
            <div className="p-4 overflow-auto max-h-96">
              {users.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">ユーザーはいません</p>
              ) : (
                <ul className="space-y-3">
                  {users.map((u) => (
                    <li key={u.id} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800">{u.nickname}</p>
                          <p className="text-xs text-slate-400">ID: {u.id} | Stamps: {u.stamps}</p>
                        </div>
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <button type="submit" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* HASHES SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Hash size={20} className="text-pink-500" />
                使用済み食券番号
              </h2>
              <span className="bg-pink-100 text-pink-800 text-xs font-bold px-3 py-1 rounded-full">
                {hashes.length} 件
              </span>
            </div>
            
            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
              <form action={addHash} className="flex gap-2">
                <input required type="text" name="hash" placeholder="食券番号 (例: 123456)" className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                <select required name="user_id" className="w-24 px-2 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="">User ID</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.nickname}</option>)}
                </select>
                <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-lg transition flex items-center justify-center">
                  <Plus size={20} />
                </button>
              </form>
            </div>

            <div className="p-4 overflow-auto max-h-[300px]">
              {hashes.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">食券履歴はありません</p>
              ) : (
                <ul className="space-y-3">
                  {hashes.map((h) => (
                    <li key={h.hash} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800">{h.hash}</p>
                        <p className="text-xs text-slate-400">By User ID: {h.user_id}</p>
                      </div>
                      <form action={deleteHash}>
                        <input type="hidden" name="hash" value={h.hash} />
                        <button type="submit" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Hash">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
