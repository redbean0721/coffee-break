# coffee-break ☕

伺服器去泡咖啡了，晚點回來。

一個手繪風格的維護中頁面。單一 HTML 檔，沒有依賴，也不用 build，丟上去就能用。

- 筆記本紙張背景、手繪抖線插圖：一隻貓趴在伺服器上睡覺，旁邊有一杯冒煙的咖啡
- 顯示最晚回來時間，並倒數剩下多久
- Discord 群組連結做成便利貼樣式
- 自動切換深色模式，手機版面也排好了
- 會尊重使用者的 `prefers-reduced-motion` 設定，關掉動畫

## 設定

所有設定都在 `index.html` 最上面：

```js
/* ================= 設定區 ================= */
// 最晚回來時間（台灣時間，格式：YYYY-MM-DDTHH:mm:ss+08:00）
const BACK_AT = "2026-10-15T23:00:00+08:00";
// Discord 群組邀請連結
const DISCORD_URL = "https://discord.gg/your-invite";
// 時間到後是否每 30 秒自動重新整理
const AUTO_CHECK = true;
/* ========================================== */
```

| 變數 | 說明 |
| --- | --- |
| `BACK_AT` | 最晚回來的時間，要帶時區。頁面會用台灣時間顯示 |
| `DISCORD_URL` | 便利貼按鈕連到的 Discord 邀請網址 |
| `AUTO_CHECK` | 設為 `true` 時，超過 `BACK_AT` 後每 30 秒會重新整理一次 |

## 部署

這頁最好是**在原本的網址直接回傳**，不要轉址到另一個路徑。這樣維護結束後，自動重新整理就會直接回到正常網站。回傳時記得用 HTTP **503**，搜尋引擎才不會把它當成正式內容。

### nginx

```nginx
location / {
    return 503;
}

error_page 503 /index.html;
location = /index.html {
    root /var/www/coffee-break;
    internal;
    add_header Retry-After 3600 always;
}
```

### Traefik（errors middleware）

先把頁面跑成一個小服務（例如 `nginx:alpine` 掛載這個檔案），再用 errors middleware 接住 5xx：

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: coffee-break
spec:
  errors:
    status:
      - "502-504"
    service:
      name: coffee-break
      port: 80
    query: /index.html
```

把這個 middleware 掛到 IngressRoute 上之後，後端掛掉或正在維護時，就會自動顯示這一頁。

### Cloudflare Pages（用環境變數覆蓋設定）

Repo 裡的 `index.html` 只放預設值，實際部署的值設定在 Cloudflare 上，不用 commit。

1. 在 Pages 專案設定 build：
   - **Build command**：`node build.mjs`
   - **Build output directory**：`dist`
2. 在 **Settings → Variables and Secrets** 加上要覆蓋的變數（沒設定的就沿用 HTML 裡的預設值）：

   | 變數 | 範例 |
   | --- | --- |
   | `BACK_AT` | `2026-10-15T23:00:00+08:00` |
   | `DISCORD_URL` | `https://discord.gg/xxxxxx` |
   | `AUTO_CHECK` | `true` / `false` |

3. 改完變數之後要**重新部署一次**，新的值才會生效。

本機測試：

```sh
BACK_AT="2026-10-16T02:00:00+08:00" DISCORD_URL="https://discord.gg/abc" node build.mjs
# 產生 dist/index.html
```

> Pages 的靜態檔一律回 HTTP 200。如果需要回 503，要另外加 Pages Function 或 Worker 改狀態碼。

### 直接開

本機雙擊 `index.html` 就能預覽。

## 注意事項

- 自動重新整理**只看時間**，不會偵測服務是不是已經恢復。提早修好的話，訪客要自己重新整理，或等到 `BACK_AT` 之後。
- 字體從 Google Fonts 載入（霞鶩文楷 TC）。如果載入失敗，會改用系統楷體，版面不會跑掉。
- 插圖全部是內嵌 SVG，不會額外抓圖片。
