# Cinna Air 旅程元件庫

開啟 [components.html](components.html) 可以按分類預覽、逐件下載，並試用導覽、進度、按鈕、完成提示同操作提示。[試玩 Check-in](index.html)

## 素材

| 層級 | 檔案 ID |
| --- | --- |
| 場景 | `hanging-logo-sign`、`flight-info-board`、`rope-barrier` |
| 角色 | `ground-staff-cinnamoroll`、`ground-staff-idle`、`ground-staff-welcoming`、`ground-staff-completed` |
| 道具 | `boarding-pass`、`desktop-terminal`、`completion-sign` |
| 裝飾 | `balloons`、`bow`、`cloud-logo`、`sparkle`、`soft-glow-blobs` |

15 件素材嘅 PNG 原檔喺 `assets/components/png/`，長邊 2048 px，四邊有至少 64 px 透明留白。遊戲可以載入 `assets/components/previews/` 入面嘅輕量 WebP。翼形雲朵、四角星光同柔光色塊亦有 SVG。網站太窄時可用 `object-fit: contain` 保持道具完整。

角色係四張獨立靜態姿勢，全部使用 2048 × 2048 畫布，中心 x=1024，腳底共用 y=1836 對位線。切換時維持同一尺寸同位置。等待、迎賓及完成姿勢可對應報到前、靠近櫃檯及報到後。

航班資訊板、完成提示立牌同登機證票底保留可覆蓋文字嘅區域。資訊板同立牌嘅預覽以 HTML 疊字；PNG 提供空白底圖。登機證另有完整電子版，航線預設 HKG → ICN。

## 接入 UI

載入 `component-kit.css` 同 `component-kit.js`，然後將元件掛到任一元素。字重用 Light／Regular，磨砂玻璃由 `ck-glass` 提供。

```html
<link rel="stylesheet" href="component-kit.css">
<div id="chapter-progress"></div>
<script src="component-kit.js"></script>
<script>
  const progress = CinnaKit.mount(document.querySelector('#chapter-progress'), 'progress-tracker', {
    completed: 1,
    total: 5
  });
  progress.update(2);
</script>
```

| ID | 選項與方法 |
| --- | --- |
| `top-bar` | `brand`、`journey`、`controls`、`onJourney(button)`。按鈕可接到現有旅程彈窗。 |
| `progress-tracker` | `title`、`completed`、`total`；`update(completed)`。 |
| `cta-button` | `state: 'before' \| 'after'`、`label`、`disabled`、`onActivate(state)`；`update({ state, label, disabled })`。 |
| `completion-toast` | `open`、`title`、`message`、`onDismiss`；`show({ title, message })`、`hide()`。 |
| `tooltip-prompt` | `label`、`prompt`；`open()`、`close()`。按鍵盤 Escape 或失去焦點可關閉提示。 |
| `boarding-pass` | `from`、`to`、`fromCity`、`toCity`、`name`、`gate`、`seat`、`cabin`；`update(fields)`。 |
| `flight-info-board` | `route`、`status`、`src`；`update({ route, status })`。 |
| `completion-sign` | `status`、`src`；`update({ status })`。 |

## 美術方向

粉彩 3D 素材以用戶提供嘅 Check-in 概念圖同現有航站為參考，逐件重新製作獨立透明圖層。場景同道具沿用奶油金邊、粉藍、粉紅同圓潤材質；角色沿用灰紫制服、粉藍領結同一致光向。招牌保留 Cinna Air 字樣，航班板、票底同完成立牌預留可換字區。
