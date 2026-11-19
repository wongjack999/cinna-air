(() => {
  const icons = {
    plane: '<path d="M22 12a1.2 1.2 0 0 0-1.2-1.2h-6l-4.4-7H8.2l2.2 7H5.9L4 8.6H2.3L3.6 12l-1.3 3.4H4l2-2.2h4.4l-2.2 7h2.2l4.4-7h6A1.2 1.2 0 0 0 22 12Z" fill="currentColor"/>',
    route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H16a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h7.5"/>',
    arrow: '<path d="M5 12h13m-5-5 5 5-5 5"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    close: '<path d="m7 7 10 10M17 7 7 17"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8v.01"/>',
  };
  const icon = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="${id === 'plane' ? 'none' : 'currentColor'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;

  function applyText(root, values) {
    for (const element of root.querySelectorAll('[data-field]')) {
      element.textContent = values[element.dataset.field] ?? '';
    }
  }

  function topBar(root, options) {
    root.innerHTML = `<div class="ck-topbar"><div class="ck-brand"><span class="ck-brand-icon">${icon('plane')}</span><span data-field="brand"></span></div><button type="button" class="ck-journey-button ck-glass">${icon('route')}<span data-field="journey"></span></button></div>`;
    applyText(root, { brand: options.brand ?? 'Cinna Air', journey: options.journey ?? '旅程' });
    const button = root.querySelector('button');
    if (options.controls) button.setAttribute('aria-controls', options.controls);
    button.addEventListener('click', () => options.onJourney?.(button));
  }

  function progressTracker(root, options) {
    const total = Number.isInteger(options.total) && options.total > 0 ? options.total : 5;
    root.innerHTML = '<div class="ck-progress ck-glass"><div class="ck-progress-head"><h3 data-field="title"></h3><span data-ck-progress-text></span></div><div class="ck-progress-track" role="progressbar" aria-valuemin="0"></div></div>';
    applyText(root, { title: options.title ?? '旅程進度' });
    const track = root.querySelector('[role="progressbar"]');
    const label = root.querySelector('[data-ck-progress-text]');
    const segments = Array.from({ length: total }, () => document.createElement('i'));
    for (const segment of segments) segment.setAttribute('aria-hidden', 'true');
    track.append(...segments);
    track.setAttribute('aria-label', options.title ?? '旅程進度');
    track.setAttribute('aria-valuemax', total);
    function update(completed) {
      const count = Number.isFinite(completed) ? Math.max(0, Math.min(total, Math.trunc(completed))) : 0;
      track.setAttribute('aria-valuenow', count);
      label.textContent = `${count} / ${total} 完成`;
      segments.forEach((segment, index) => {
        segment.dataset.status = index < count ? 'done' : index === count ? 'current' : 'upcoming';
      });
    }
    update(options.completed ?? 1);
    return { update };
  }

  function ctaButton(root, options) {
    root.innerHTML = `<button type="button" class="ck-cta"><span></span>${icon('arrow')}</button>`;
    const button = root.querySelector('button');
    const text = button.querySelector('span');
    function update({ label, state = 'before', disabled = false } = {}) {
      button.dataset.state = state === 'after' ? 'after' : 'before';
      text.textContent = label ?? (state === 'after' ? '查看登機證' : '遞交護照');
      button.disabled = disabled;
    }
    update(options);
    button.addEventListener('click', () => options.onActivate?.(button.dataset.state));
    return { update };
  }

  function completionToast(root, options) {
    root.innerHTML = `<div class="ck-toast ck-glass" hidden><span class="ck-toast-icon">${icon('check')}</span><div role="status" aria-live="polite" aria-atomic="true"><strong></strong><p></p></div><button type="button" aria-label="關閉完成提示">${icon('close')}</button></div>`;
    const toast = root.firstElementChild;
    const title = toast.querySelector('strong');
    const message = toast.querySelector('p');
    const hide = () => { toast.hidden = true; };
    toast.querySelector('button').addEventListener('click', () => {
      hide();
      options.onDismiss?.();
    });
    function show({ title: headline = '報到完成', message: detail = 'Natalie，你嘅登機證已就緒。' } = {}) {
      toast.hidden = false;
      title.textContent = headline;
      message.textContent = detail;
    }
    if (options.open) show(options);
    return { show, hide };
  }

  let tooltipId = 0;

  function tooltipPrompt(root, options) {
    root.innerHTML = `<div class="ck-tooltip"><button class="ck-glass" type="button" aria-expanded="false">${icon('info')}<span data-field="label"></span></button><span role="tooltip" data-field="prompt" hidden></span></div>`;
    applyText(root, { label: options.label ?? '護照提示', prompt: options.prompt ?? '點擊護照，或拖到櫃檯。' });
    const button = root.querySelector('button');
    const prompt = root.querySelector('[role="tooltip"]');
    prompt.id = 'ck-tooltip-' + ++tooltipId;
    button.setAttribute('aria-describedby', prompt.id);
    button.setAttribute('aria-controls', prompt.id);
    function toggle(open) {
      prompt.hidden = !open;
      button.setAttribute('aria-expanded', open);
    }
    button.addEventListener('click', () => toggle(prompt.hidden));
    button.addEventListener('blur', () => toggle(false));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') toggle(false);
    });
    return { open: () => toggle(true), close: () => toggle(false) };
  }

  function boardingPass(root, options) {
    root.innerHTML = `<article class="ck-pass"><div class="ck-pass-head"><span>Cinna Air</span>${icon('plane')}</div><div class="ck-pass-route"><div><strong data-field="from"></strong><small data-field="fromCity"></small></div><span class="ck-pass-line">${icon('plane')}</span><div><strong data-field="to"></strong><small data-field="toCity"></small></div></div><dl><div><dt>旅客</dt><dd data-field="name"></dd></div><div><dt>登機閘口</dt><dd data-field="gate"></dd></div><div><dt>座位</dt><dd data-field="seat"></dd></div><div><dt>艙等</dt><dd data-field="cabin"></dd></div></dl><div class="ck-pass-stub" aria-hidden="true"><i></i></div></article>`;
    const defaults = { from: 'HKG', fromCity: '香港', to: 'ICN', toCity: '首爾', name: 'Natalie', gate: 'A07', seat: '2A', cabin: '公主艙' };
    let data = { ...defaults };
    function update(changes) {
      data = { ...data, ...changes };
      applyText(root, data);
    }
    update(options);
    return { update };
  }

  function stageDisplay(root, id, options) {
    const isFlight = id === 'flight-info-board';
    const fallback = isFlight
      ? { route: 'HKG → ICN', status: '報到中' }
      : { status: '報到完成' };
    const text = isFlight ? '<strong data-field="route"></strong><span data-field="status"></span>' : '<strong data-field="status"></strong>';
    root.innerHTML = `<figure class="ck-display ${isFlight ? 'ck-flight' : 'ck-completion-sign'}"><img alt=""><figcaption>${text}</figcaption></figure>`;
    root.querySelector('img').src = options.src ?? 'assets/components/previews/' + id + '.webp';
    let data = fallback;
    function update(changes) {
      data = { ...data, ...changes };
      applyText(root, data);
    }
    update(options);
    return { update };
  }

  const components = {
    'top-bar': topBar,
    'progress-tracker': progressTracker,
    'cta-button': ctaButton,
    'completion-toast': completionToast,
    'tooltip-prompt': tooltipPrompt,
    'boarding-pass': boardingPass,
    'flight-info-board': (root, options) => stageDisplay(root, 'flight-info-board', options),
    'completion-sign': (root, options) => stageDisplay(root, 'completion-sign', options),
  };

  window.CinnaKit = {
    mount(root, name, options = {}) {
      if (!Object.hasOwn(components, name)) throw new Error('Unknown Cinna Air component: ' + name);
      root.classList.add('cinna-kit');
      return components[name](root, options);
    },
  };
})();
