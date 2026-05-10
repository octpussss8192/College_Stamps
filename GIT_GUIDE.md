# Gitの使い方ガイド (工クオン_学食スタンプ)

このプロジェクトを複数人で安全に開発するためのGit基本操作ガイドです。

## 1. 基本の流れ (Push/Pull)

### 最新の状態を取り込む
作業を始める前に、必ず他人の変更を取り込みます。
```powershell
git pull origin main
```

### 自分の変更を保存・共有する
1.  **変更したファイルを確認**
    ```powershell
    git status
    ```
2.  **変更をステージング（保存対象にする）**
    ```powershell
    git add .
    ```
3.  **コミット（メッセージを残す）**
    ```powershell
    git commit -m "機能追加: 特典画面の演出を追加"
    ```
4.  **GitHubに送信**
    ```powershell
    git push origin main
    ```

---

## 2. 困った時のレスキューコマンド

### PCが重い・挙動がおかしい時の「リセット」
ローカルの変更をすべて捨てて、GitHubの最新（v0.0.8等）の状態に強制的に戻します。
**注意: 未保存の作業はすべて消えます。**
```powershell
git fetch origin
git reset --hard origin/main
git clean -fd
```

### コンフリクト（衝突）が起きた時
同じファイルを複数人で編集して `pull` した時に発生します。
1.  VS Codeなどで `<<<<<<< HEAD` と表示されている箇所を探す。
2.  残したいコードを選んで編集する。
3.  `git add .` -> `git commit` で解決を完了させる。

---

## 3. プロジェクト固有の注意点

*   **ディレクトリに注意**: `gakushoku-app` と `scan-app` が分かれています。コマンドを打つ場所（CWD）を確認してください。
*   **`.env.local` は共有しない**: データベースのパスワードなどの機密情報はGitに含まれません（`.gitignore` で除外されています）。

---

## 4. 便利な確認コマンド
*   **履歴を見る**: `git log --oneline -n 10`
*   **現在の状況**: `git status`
*   **誰がどこを変えたか**: `git diff`
