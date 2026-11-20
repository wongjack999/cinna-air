(() => {
  const groups = {
    scene: {
      title: '場景層',
      items: [
        ['hanging-logo-sign', '吊掛品牌招牌', '連掛耳、藍色蝴蝶結同 Cinna Air 字樣。'],
        ['flight-info-board', '航班資訊板', '留空顯示區，可以疊上航班、目的地同狀態。'],
        ['rope-barrier', '排隊欄杆', '兩支金色欄柱同粉紅繩，可重複排成隊列。'],
      ],
    },
    character: {
      title: '角色層',
      items: [
        ['ground-staff-cinnamoroll', '玉桂狗地勤', '全身角色基準造型，供其他關卡沿用。'],
        ['ground-staff-idle', '等待姿勢', '合手等待，適合報到前狀態。'],
        ['ground-staff-welcoming', '迎賓姿勢', '單手揮手，適合玩家抵達櫃檯。'],
        ['ground-staff-completed', '完成姿勢', '舉起雙手慶祝，適合報到成功回饋。'],
      ],
    },
    prop: {
      title: '道具層',
      items: [
        ['boarding-pass', '登機證票底', '空白印版供場景擺放，電子版可更換旅客同航班資料。'],
        ['desktop-terminal', '櫃檯電腦', '從旅客方向睇到機背同底座。'],
        ['completion-sign', '完成提示立牌', '留空牌面可疊加文字，適合用於報到後。'],
      ],
    },
    ui: {
      title: 'UI 層',
      items: [
        ['top-bar', '頂部導覽', '點擊「旅程」可打開進度清單。'],
        ['progress-tracker', '旅程進度', '試切換 1／5 同 2／5。'],
        ['cta-button', '主操作按鈕', '可切換報到前、報到後同停用狀態。'],
        ['completion-toast', '完成提示', '試顯示或關閉報到成功提示。'],
        ['tooltip-prompt', '操作提示', '點擊查看，Escape 或離開焦點可收起。'],
      ],
    },
    decoration: {
      title: '裝飾層',
      items: [
        ['balloons', '粉彩氣球', '心形氣球同珠感圓球一組，包含完整繩結。'],
        ['bow', '粉藍蝴蝶結', '可用於招牌、角色配飾同獎勵畫面。'],
        ['cloud-logo', '翼形雲朵圖案', '可無損縮放嘅藍色品牌圖案。'],
        ['sparkle', '四角星光', '適合點綴收件同完成回饋。'],
        ['soft-glow-blobs', '柔光色塊', '粉、藍同暖金嘅透明色光，可疊於背景。'],
      ],
    },
  };

  const container = document.querySelector('#component-sections');
  const boarding = document.querySelector('#boarding-demo');
  window.CinnaKit.mount(boarding.querySelector('[data-pass-demo]'), 'boarding-pass');

  function control(toolbar, label, callback) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'demo-control';
    button.textContent = label;
    button.addEventListener('click', callback);
    toolbar.append(button);
    return button;
  }

  function alternatives(toolbar, labels, select) {
    const buttons = labels.map((label, index) => control(toolbar, label, () => activate(index)));
    function activate(index) {
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', i === index));
      select(index);
    }
    activate(0);
    return activate;
  }

  function makeDemo(id) {
    const demo = document.createElement('div');
    demo.className = 'demo';
    demo.dataset.demo = id;
    const mount = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.className = 'demo-toolbar';
    const dialog = document.querySelector('#journey-demo');
    demo.append(mount);
    const options = {
      'top-bar': { controls: dialog.id, onJourney: () => dialog.showModal() },
      'completion-toast': { open: true },
      'cta-button': { onActivate: (state) => {
        if (state === 'before') activateCTA(1);
        else boarding.showModal();
      } },
    };
    const api = window.CinnaKit.mount(mount, id, options[id]);
    let activateCTA;
    if (id === 'progress-tracker') {
      alternatives(toolbar, ['報到前', '報到後'], (index) => api.update(index + 1));
    }
    if (id === 'cta-button') {
      activateCTA = alternatives(toolbar, ['報到前', '報到後', '停用'], (index) => api.update({
        state: index === 1 ? 'after' : 'before',
        disabled: index === 2,
      }));
    }
    if (id === 'completion-toast') {
      control(toolbar, '顯示完成提示', () => api.show());
    }
    if (toolbar.childElementCount > 0) demo.append(toolbar);
    return demo;
  }

  const offlineDownloads = location.protocol === 'file:' ? new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'assets/components/offline.js';
    script.onload = () => resolve(window.CinnaOffline);
    script.onerror = () => resolve(null);
    document.head.append(script);
  }) : null;

  function downloadLink(path, label, name) {
    const link = document.createElement('a');
    link.href = path;
    link.download = path.split('/').pop();
    link.textContent = label;
    link.setAttribute('aria-label', '下載' + name + ' ' + label.replace(' ↓', ''));
    if (offlineDownloads) {
      link.addEventListener('click', async (event) => {
        if (link.href.startsWith('blob:')) return;
        const entry = window.CinnaOffline?.[path];
        if (entry) {
          setBlobUrl(entry);
          return;
        }
        event.preventDefault();
        const files = await offlineDownloads;
        if (files?.[path]) {
          setBlobUrl(files[path]);
          link.click();
        } else {
          location.href = path;
        }
      });
    }

    function setBlobUrl([type, data]) {
      const bytes = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
      link.href = URL.createObjectURL(new Blob([bytes], { type }));
    }

    return link;
  }

  function makeCard(id, title, text, group) {
    const card = document.createElement('article');
    card.className = 'asset-card';
    card.dataset.component = id;
    const file = window.CinnaAssets[id];
    if (file) {
      const preview = document.createElement('div');
      preview.className = 'asset-preview';
      if (['flight-info-board', 'completion-sign'].includes(id)) {
        const overlay = document.createElement('div');
        overlay.className = 'asset-overlay';
        overlay.dataset.asset = id;
        window.CinnaKit.mount(overlay, id);
        preview.append(overlay);
      } else {
        const image = new Image();
        image.src = 'assets/components/' + (group === 'character' ? 'png/' + id + '.png' : 'previews/' + id + '.webp');
        image.alt = title;
        image.loading = 'lazy';
        preview.append(image);
      }
      card.append(preview);
    }
    if (group === 'ui' || id === 'boarding-pass') card.append(makeDemo(id));
    const info = document.createElement('div');
    info.className = 'info';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const detail = document.createElement('p');
    detail.textContent = text;
    const code = document.createElement('code');
    code.textContent = file ? id + ' · ' + file.width + ' × ' + file.height : id;
    info.append(heading, code, detail);
    if (file) {
      const links = document.createElement('div');
      links.className = 'asset-links';
      links.append(downloadLink('assets/components/png/' + id + '.png', '2K PNG ↓', title));
      if (file.vector) links.append(downloadLink('assets/components/svg/' + id + '.svg', 'SVG ↓', title));
      info.append(links);
    }
    card.append(info);
    return card;
  }

  for (const [id, { title, items }] of Object.entries(groups)) {
    const section = document.createElement('section');
    section.className = 'component-section';
    section.dataset.group = id;
    const heading = document.createElement('h2');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.append(...items.map(([cid, name, text]) => makeCard(cid, name, text, id)));
    section.append(heading, grid);
    container.append(section);
  }

  const filters = [...document.querySelectorAll('[data-category]')];
  for (const filter of filters) {
    filter.addEventListener('click', () => {
      for (const button of filters) button.setAttribute('aria-pressed', button === filter);
      for (const section of container.children) {
        section.hidden = filter.dataset.category !== 'all' && section.dataset.group !== filter.dataset.category;
      }
    });
  }
})();
