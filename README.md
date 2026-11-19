# Cinna Air · Check-in

開啟 `index.html` 可以離線體驗。呢個版本由旅程第 2 站「機場報到」開始。

- 報到前可點擊護照、拖到櫃檯或按「遞交護照」。報到後可以按「查看登機證」。旅程清單可以查看進度同重玩。
- 介面航線同登機證共用 `check-in.js` 入面嘅 HKG → ICN 航程資料。基本購物金由 `baseReward` 設定，暫定 HK$300，畫面標示完成旅程後領取。
- `assets/terminal.png` 同 `assets/passport.png` 均為長邊 2048 px，遊戲載入輕量 WebP。藝術參考係提供嘅粉彩 3D 概念圖，按「全幅航站、單一中心角色、乾淨櫃檯」重繪無文字背景，再另外製作有金色字章嘅透明粉紅護照。

[旅程元件庫](components.html) 提供新增素材同玻璃 UI 預覽。整合方法見 [COMPONENTS.md](COMPONENTS.md)。
