(() => {
  'use strict';

  const assetPath = 'assets/airport-express/';
  const states = {
    ready: {
      speech: '出發去機場！',
      extra: 'Let’s go! ♡',
      status: '準備出發',
      action: 'Start Journey ♡'
    },
    ride: {
      speech: '向機場出發',
      extra: 'On our way!',
      status: '前往機場…',
      action: '前往機場…'
    },
    arrived: {
      speech: '到機場喇！',
      extra: 'Welcome to HKG ♡',
      status: '已抵達',
      action: '重播旅程 ↻'
    }
  };

  const mounted = new WeakMap();

  function mount(root) {
    if (mounted.has(root)) return mounted.get(root);
    const start = root.querySelector('[data-start]');
    const audio = root.querySelector('[data-audio]');
    const phone = root.querySelector('[data-phone]');
    const speech = root.querySelector('[data-speech]');
    const speechExtra = root.querySelector('[data-speech-extra]');
    const status = root.querySelector('[data-ride-status]');
    let audioContext;

    async function chime(notes) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio || audio.getAttribute('aria-pressed') !== 'true') return;
      try {
        audioContext ??= new Audio();
        if (audioContext.state === 'suspended') await audioContext.resume();
        const startAt = audioContext.currentTime + 0.025;
        notes.forEach((frequency, index) => {
          const tone = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const noteAt = startAt + index * 0.12;
          tone.type = 'sine';
          tone.frequency.value = frequency;
          gain.gain.setValueAtTime(0, noteAt);
          gain.gain.linearRampToValueAtTime(0.067, noteAt + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.001, noteAt + 0.19);
          tone.connect(gain).connect(audioContext.destination);
          tone.start(noteAt);
          tone.stop(noteAt + 0.2);
        });
      } catch {
        // A browser audio restriction should still allow the preview to play.
      }
    }

    function render(key) {
      const state = states[key];
      root.dataset.state = key;
      speech.textContent = state.speech;
      speechExtra.textContent = state.extra;
      status.textContent = state.status;
      start.textContent = state.action;
      start.disabled = key === 'ride';
    }

    audio.addEventListener('click', () => {
      const enabled = audio.getAttribute('aria-pressed') === 'true';
      audio.setAttribute('aria-pressed', String(!enabled));
      if (!enabled) chime([523.25, 659.25]);
    });

    start.addEventListener('click', () => {
      if (root.dataset.state !== 'ready') {
        render('ready');
        return;
      }
      chime([523.25, 659.25, 783.99]);
      render('ride');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => {
        render('arrived');
        start.focus({ preventScroll: true });
        root.dispatchEvent(new CustomEvent('cinna:express-arrived', { bubbles: true }));
      }, reduceMotion ? 0 : 1550);
    });

    const preview = {
      setPhoneMode(mode) {
        if (mode !== 'ticket' && mode !== 'destination') return;
        phone.dataset.mode = mode;
      }
    };
    mounted.set(root, preview);
    return preview;
  }

  let offlineFiles;

  function loadOfflineFiles() {
    offlineFiles ??= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = assetPath + 'offline.js';
      script.onload = () => {
        resolve(window.CinnaExpressDownloads);
        delete window.CinnaExpressDownloads;
      };
      script.onerror = () => {
        script.remove();
        offlineFiles = undefined;
        reject(new Error('Missing download data'));
      };
      document.head.append(script);
    });
    return offlineFiles;
  }

  function prepareOfflineDownload(link, path, label) {
    let blobUrl;
    link.addEventListener('click', async event => {
      if (blobUrl) return;
      event.preventDefault();
      if (link.hasAttribute('aria-busy')) return;
      link.setAttribute('aria-busy', 'true');
      link.textContent = '準備下載…';
      try {
        const files = await loadOfflineFiles();
        const data = atob(files[path]);
        const bytes = Uint8Array.from(data, character => character.charCodeAt(0));
        const type = path.endsWith('.png') ? 'image/png' : 'image/svg+xml';
        blobUrl = URL.createObjectURL(new Blob([bytes], { type }));
        link.href = blobUrl;
        link.textContent = label + ' ↓';
        link.click();
      } catch {
        link.textContent = '重試下載';
      } finally {
        link.removeAttribute('aria-busy');
      }
    });
  }

  function downloadLink(path, label, title) {
    const link = document.createElement('a');
    link.href = path;
    link.download = path.split('/').pop();
    link.textContent = label + ' ↓';
    link.setAttribute('aria-label', '下載 ' + title + ' ' + label);
    if (location.protocol === 'file:') prepareOfflineDownload(link, path, label);
    return link;
  }

  function createCard(asset) {
    const article = document.createElement('article');
    article.className = 'express-card';
    const visual = document.createElement('div');
    visual.className = 'express-card-visual';
    const image = document.createElement('img');
    const directory = asset.vector ? 'svg' : asset.layer === 'character' ? 'png' : 'previews';
    const extension = asset.vector ? 'svg' : asset.layer === 'character' ? 'png' : 'webp';
    image.src = assetPath + directory + '/' + asset.id + '.' + extension;
    image.alt = '';
    image.loading = 'lazy';
    visual.append(image);

    const body = document.createElement('div');
    body.className = 'express-card-body';
    const heading = document.createElement('h3');
    heading.textContent = asset.title;
    const info = document.createElement('code');
    info.textContent = asset.id + ' · ' + asset.width + ' × ' + asset.height;
    const links = document.createElement('div');
    links.className = 'express-downloads';
    links.append(downloadLink(assetPath + 'png/' + asset.id + '.png', '2K PNG', asset.title));
    if (asset.vector) links.append(downloadLink(assetPath + 'svg/' + asset.id + '.svg', 'SVG', asset.title));
    body.append(heading,info,links);
    article.append(visual,body);
    return article;
  }

  window.CinnaExpress = Object.freeze({ mount });
  document.querySelectorAll('[data-express]').forEach(mount);

  const gallery = document.querySelector('[data-art-assets]');
  if (!gallery) return;
  gallery.append(...window.CinnaExpressAssets.map(createCard));

  const demo = mount(document.querySelector('[data-express]'));
  const choices = document.querySelectorAll('[data-mode-choice]');
  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      demo.setPhoneMode(choice.dataset.modeChoice);
      choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    });
  });
})();
