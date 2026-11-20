# Princess Airport Express

備選啟動頁。直接以瀏覽器打開 `airport-express.html`，可試玩接載、抵達同重播，亦可逐件下載。

## 插畫資產

| 層級（由底至頂） | 檔案名稱 | 用法 |
| --- | --- | --- |
| 場景 | `ride-cabin`, `airport-exterior` | 3:4 全畫面，車內同抵達兩段可各自用 |
| 角色 | `driver` | 可獨立擺位嘅玉桂狗司機 |
| 前景道具 | `ride-suitcase`, `ride-phone` | 行李箱同空白手機，手機內容由 HTML 疊加 |
| 品牌 | `ride-title` | Cinna Air 立體雲朵招牌 |
| UI 圖示與裝飾 | `ride-car`, `ride-plane`, `ride-sparkles`, `ride-tap-cue` | 點按手勢圖示收錄喺元件庫，按預覽用途取用 |

`assets/airport-express/png/` 嘅 PNG 最長邊為 2048 px，保持比例，透明圖保留四邊留白。兩張背景為 1536 × 2048 px。四款圖示同時有 SVG 原檔，插畫 WebP 在 `previews/`。PNG 由生成原圖按比例輸出至 2K。

## 介面組件

`ex-speech` 對白、`ex-route` 叫車進度、`ex-phone-card` 手機票卡、`ex-audio` 音效開關、`ex-start` 按鈕、`ex-backdrop` 抵達過場使用共用樣式。可沿用樣式中嘅文字色 `--ex-ink`、次要文字色 `--ex-muted` 同過場緩動 `--ex-ease`。玻璃卡使用半透明薰衣草底色、模糊、白色邊框，正文以 400 字重為主。

複製預覽頁嘅 `[data-express]` 場景標記，並載入同路徑嘅 CSS、JS 同資產。畫面按 `ready → ride → arrived` 轉換，完成後重播會返到 `ready`。每次抵達會在場景元素發出可冒泡嘅 `cinna:express-arrived` 事件。用 `CinnaExpress.mount(element).setPhoneMode('ticket')` 顯示票面，或用 `'destination'` 顯示 HKG Airport。票面以 HKG → ICN 為示意。尊重裝置減少動態效果設定。
