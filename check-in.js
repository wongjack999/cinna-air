(() => {
  const flight = {
    from: 'HKG', fromCity: '香港', to: 'ICN', toCity: '首爾',
  };
  const baseReward = 300;
  const chapterCount = 5;
  const screens = {
    before: {
      title: '出示護照', hint: '點擊護照，或拖到櫃檯。',
      action: '遞交護照', completed: 1,
    },
    after: {
      title: '報到完成', hint: 'Natalie，你嘅登機證已就緒。',
      action: '查看登機證', completed: 2,
    },
  };
  const game = document.querySelector('.game');
  const stage = game.querySelector('[data-stage]');
  const drop = game.querySelector('[data-drop]');
  const passport = game.querySelector('[data-passport]');
  const action = game.querySelector('[data-action]');
  const actionLabel = action.querySelector('[data-action-label]');
  const status = game.querySelector('[data-status]');
  const hint = game.querySelector('[data-hint]');
  const progress = game.querySelector('.progress');
  const progressText = game.querySelector('[data-progress-text]');
  const step = game.querySelector('[data-check-in-step]');
  const stepStatus = step.querySelector('[data-check-in-status]');
  const nextStatus = game.querySelector('[data-next-status]');
  const boarding = game.querySelector('[data-boarding]');
  const journey = game.querySelector('[data-journey]');
  const reset = journey.querySelector('[data-reset]');
  let drag;
  let ignoreClick = false;

  for (const field of game.querySelectorAll('[data-route]')) {
    field.textContent = flight[field.dataset.route];
  }
  for (const route of game.querySelectorAll('[data-route-summary]')) {
    route.setAttribute('aria-label', `${flight.from} 至 ${flight.to}，${flight.fromCity}前往${flight.toCity}`);
  }
  game.querySelector('[data-reward]').textContent = `HK$${baseReward.toLocaleString('en-HK')}`;

  function clearDrag() {
    const pointer = drag?.id;
    drag = undefined;
    if (pointer !== undefined && passport.hasPointerCapture(pointer)) passport.releasePointerCapture(pointer);
    delete stage.dataset.dragging;
    delete passport.dataset.dragging;
    delete drop.dataset.over;
    for (const property of ['--x', '--y', '--pitch', '--yaw']) passport.style.removeProperty(property);
  }

  function setState(state) {
    clearDrag();
    const previous = game.dataset.state;
    const data = screens[state];
    const after = state === 'after';
    game.dataset.state = state;
    status.textContent = data.title;
    hint.textContent = data.hint;
    actionLabel.textContent = data.action;
    passport.hidden = after;
    if (after) {
      action.setAttribute('aria-haspopup', 'dialog');
      action.setAttribute('aria-controls', boarding.id);
    } else {
      action.removeAttribute('aria-haspopup');
      action.removeAttribute('aria-controls');
    }
    progress.setAttribute('aria-valuenow', data.completed);
    progressText.textContent = `${data.completed} / ${chapterCount} 完成`;
    step.classList.toggle('done', after);
    stepStatus.textContent = after ? '已完成' : '進行中';
    nextStatus.textContent = after ? '下一站' : '待解鎖';
    reset.hidden = !after;
    if (state !== previous) {
      game.dispatchEvent(new CustomEvent('cinna:check-in-change', {
        bubbles: true, detail: { state, previous },
      }));
    }
  }

  function checkIn() {
    if (game.dataset.state !== 'before') return;
    setState('after');
    action.focus({ preventScroll: true });
  }

  function hitCounter(event) {
    const area = drop.getBoundingClientRect();
    return event.clientX >= area.left && event.clientX <= area.right &&
      event.clientY >= area.top && event.clientY <= area.bottom;
  }

  passport.addEventListener('click', (event) => {
    if (!ignoreClick || event.detail === 0) checkIn();
  });
  passport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    passport.setPointerCapture(event.pointerId);
  });
  passport.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(x, y) < 8) return;
    drag.moved = true;
    stage.dataset.dragging = '';
    passport.dataset.dragging = '';
    drop.toggleAttribute('data-over', hitCounter(event));
    passport.style.setProperty('--x', `${x}px`);
    passport.style.setProperty('--y', `${y}px`);
    passport.style.setProperty('--pitch', `${Math.max(-17, Math.min(26, 8 - y / 12))}deg`);
    passport.style.setProperty('--yaw', `${Math.max(-23, Math.min(23, 8 + x / 10))}deg`);
  });
  passport.addEventListener('pointerup', (event) => {
    if (drag?.id !== event.pointerId) return;
    ignoreClick = drag.moved;
    if (drag.moved && hitCounter(event)) {
      checkIn();
    } else {
      if (drag.moved) hint.textContent = '試吓拖到櫃檯虛線區，或點按「遞交護照」。';
      clearDrag();
    }
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    passport.addEventListener(type, (event) => {
      if (drag?.id === event.pointerId) clearDrag();
    });
  }

  action.addEventListener('click', () => {
    if (game.dataset.state === 'before') checkIn();
    else boarding.showModal();
  });
  game.querySelector('[data-open-journey]').addEventListener('click', () => journey.showModal());
  for (const dialog of [journey, boarding]) {
    for (const close of dialog.querySelectorAll('[data-close]')) {
      close.addEventListener('click', () => dialog.close());
    }
  }
  reset.addEventListener('click', () => {
    journey.close();
    setState('before');
    action.focus({ preventScroll: true });
  });
  setState('before');
})();
