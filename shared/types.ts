/**
 * 学食クソアプリ - プロジェクト間共有型定義
 * 分割開発される各アプリ（スキャン/メイン）で共通して使用する。
 */

/**
 * OCR解析結果のデータ形式
 * スキャンアプリが解析完了時に生成し、将来的にメインアプリのスタンプ機能に渡される。
 */
export interface ScanResult {
  date: string;       // "26.04.14" (YY.MM.DD形式)
  time: string;       // "12:30" (HH:mm形式)
  price: number;      // 読み取った金額 (例: 450)
  hash: string;       // 食券の一意のID (6-8桁の数字などを想定)
  isVisionActive: boolean; // 解析にGoogle Vision APIが使用されたか
}

/**
 * スタンプ登録リクエストのデータ形式 (POST /api/stamp)
 */
export interface StampRequest extends ScanResult {}

/**
 * APIレスポンスの基本形式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
