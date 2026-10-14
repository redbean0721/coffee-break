// 部署時用環境變數覆蓋 index.html 裡的設定，輸出到 dist/index.html
// 沒設定的變數會保留 HTML 裡的預設值
import { readFile, writeFile, mkdir } from "node:fs/promises";

let html = await readFile("index.html", "utf8");

// 字串安全地塞進 <script>：避免 </script> 之類的內容跳出標籤
const toJs = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

function set(name, value) {
  if (value === undefined || value === "") return;
  const re = new RegExp(`(const ${name} = )[^;]+;`);
  if (!re.test(html)) throw new Error(`找不到設定 ${name}`);
  html = html.replace(re, `$1${value};`);
  console.log(`✔ ${name} = ${value}`);
}

const { BACK_AT, DISCORD_URL, AUTO_CHECK } = process.env;

if (BACK_AT && Number.isNaN(Date.parse(BACK_AT))) {
  throw new Error(`BACK_AT 格式不對：${BACK_AT}（例：2026-10-15T23:00:00+08:00）`);
}

set("BACK_AT", BACK_AT && toJs(BACK_AT));
set("DISCORD_URL", DISCORD_URL && toJs(DISCORD_URL));
set("AUTO_CHECK", AUTO_CHECK && String(AUTO_CHECK === "true"));

await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html);
console.log("→ dist/index.html");
