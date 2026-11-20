(() => {
  const flight = { number: 'NAT818', departure: '18:18', counter: 'A2', from: 'HKG', fromCity: '香港', to: 'ICN', toCity: '首爾' };
  const flightPages = [
    [['NAT813', 'TPE', 'A1'], ['NAT816', 'ICN', 'A2'], ['NAT881', 'NRT', 'A3'],
      ['NAT819', 'ICN', 'A4'], ['NAT811', 'KIX', 'A5']],
    [['NAT188', 'ICN', 'A2'], ['NAT817', 'TPE', 'A1'], ['NAT808', 'ICN', 'A6'],
      ['NTA818', 'NRT', 'A7'], ['NAT838', 'KIX', 'A3']],
    [['NAT810', 'KIX', 'A1'], ['NAT688', 'ICN', 'A2'], [flight.number, flight.to, flight.counter],
      ['NAT868', 'NRT', 'A5'], ['NAT888', 'ICN', 'A8']],
  ];
  const baseReward = 600;
  const cabinDuration = 30_000;
  const resultKey = 'cinna-air-v4-result';
  const money = amount => 'HK$' + amount.toLocaleString('en-HK');
  const screens = {
    launch: { scene: 'invitation', title: 'Cinna Air · 公主購物之旅' },
    mystery: { scene: 'invitation', title: '神秘信封' },
    invitation: { scene: 'invitation', title: '邀請函' },
    approach: { scene: 'airport', title: '前往機場' },
    entry: { scene: 'entrance', title: '進入機場' },
    flights: { scene: 'departures', title: '揀航班' },
    greeting: { scene: 'counter', title: 'A2 報到櫃檯' },
    passport: { scene: 'counter', title: '機場報到' },
    signature: { scene: 'counter', title: '旅客入境資料卡' },
    collect: { scene: 'counter', boardStatus: '等候領證', title: '機場報到' },
    complete: { scene: 'counter', boardStatus: '準備登機', title: '旅程購物金' },
    cabinReady: { scene: 'cabin', title: '機艙挑戰' },
    cabinPlay: { scene: 'cabin', title: '機艙挑戰' },
    cabinDone: { scene: 'cabin', title: '抵達首爾' },
    baggage: { scene: 'baggage', title: '幸運行李箱' },
    result: { scene: 'baggage', title: '旅程完成' },
  };

  const game = document.querySelector('.game');
  const q = selector => game.querySelector(selector);
  const stage = q('[data-stage]');
  const drop = q('[data-drop]');
  const passport = q('[data-passport]');
  const machine = q('[data-machine]');
  const printedTicket = q('[data-printed-ticket]');
  const windowSpot = q('[data-window]');
  const boarding = q('[data-boarding]');
  const signature = q('[data-signature]');
  const signaturePad = q('[data-signature-pad]');
  const arrivalDetails = q('[data-arrival-details]');
  const passengerInput = q('[data-passenger-input]');
  const signatureFields = q('[data-signature-fields]');
  const signatureConfirm = q('[data-confirm-signature]');
  const ink = signaturePad.getContext('2d');
  const flightList = q('[data-flight-slide]');
  const previousFlightPage = q('[data-previous-flight]');
  const nextFlightPage = q('[data-next-flight]');
  const confirmFlight = q('[data-pick-flight]');
  const flightRows = [...game.querySelectorAll('[data-flight-row]')];
  const travel = q('[data-travel]');
  const flightTrigger = q('[data-open-flight]');
  const chapterTitle = q('#chapter-title');
  const launch = q('[data-launch]');
  const launchThumb = q('[data-launch-thumb]');
  const openLetter = q('[data-open-letter]');
  const invitationPackage = q('[data-invitation-package]');
  const invitationLetter = q('[data-letter]');
  const acceptInvitation = q('[data-accept-invitation]');
  const pocket = q('[data-invitation-pocket]');
  const pocketDialog = q('[data-invitation-dialog]');
  const target = q('[data-target]');
  const targetImage = target.querySelector('img');
  const targetArea = q('[data-cabin-targets]');
  const hud = q('[data-cabin-hud]');
  const baggage = q('[data-baggage]');
  const result = q('[data-result]');
  const clerk = q('[data-counter-staff]');
  const clerkImage = clerk.querySelector('img');
  const clerkBlink = q('[data-clerk-blink]');
  const clerkBlinkSrc = 'assets/components/animation/ground-staff-blinking.gif';
  const flightStatus = q('[data-flight-status]');
  const poses = {
    greeting: ['assets/components/png/ground-staff-cinnamoroll.png', '玉桂狗地勤探頭迎賓'],
    passport: ['assets/components/png/ground-staff-cinnamoroll.png', '玉桂狗地勤迎賓'],
    signature: ['assets/components/png/ground-staff-cinnamoroll.png', '玉桂狗地勤等候簽名'],
    collect: ['assets/components/png/ground-staff-idle.png', '玉桂狗地勤等候領證'],
    complete: ['assets/components/png/ground-staff-completed.png', '玉桂狗地勤慶祝報到完成'],
  };
  const clerkImages = Object.fromEntries(Object.entries(poses).map(([step, [src]]) => {
    const image = new Image();
    image.src = src;
    return [step, image];
  }));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'launch';
  let flightPage = 0;
  let selectedFlight = -1;
  let flightSwiped = false;
  let signaturePointer;
  let hasInk = false;
  let passportDrag;
  let moving = false;
  let transitionTimer;
  let cabinTimer;
  let deadline = 0;
  let lastSpawn = 0;
  let targetAvailable = false;
  let catches = 0;
  let flightBonus = 0;
  let luckyBonus = 0;
  let ownsPass = false;

  const departureTime = q('[data-flight-departure]');
  departureTime.dateTime = departureTime.textContent = flight.departure;
  for (const field of game.querySelectorAll('[data-flight-number]')) field.textContent = flight.number;
  for (const field of game.querySelectorAll('[data-route]')) field.textContent = flight[field.dataset.route];
  for (const route of game.querySelectorAll('[data-route-summary]')) {
    route.setAttribute('aria-label', flight.from + ' 至 ' + flight.to + '，香港前往首爾');
  }

  function setState(next) {
    const previous = state;
    state = next;
    const view = screens[next];
    game.dataset.state = next;
    game.dataset.scene = view.scene;
    chapterTitle.textContent = view.title;
    passport.hidden = next !== 'passport';
    flightTrigger.hidden = next !== 'complete';
    q('[data-invitation]').hidden = view.scene !== 'invitation';
    launch.hidden = next !== 'launch';
    invitationPackage.hidden = next === 'launch';
    q('[data-teaser]').hidden = next !== 'mystery';
    invitationLetter.hidden = acceptInvitation.hidden = next !== 'invitation';
    pocket.hidden = view.scene === 'invitation';
    pocket.disabled = pocket.hidden;
    openLetter.hidden = next !== 'mystery';
    travel.hidden = next !== 'approach' && next !== 'entry';
    travel.textContent = next === 'approach' ? '前往機場入口' : '進入出發大堂';
    q('[data-departures]').hidden = next !== 'flights';
    q('[data-greeting]').hidden = next !== 'greeting';
    clerk.hidden = !poses[next];
    if (!clerk.hidden) {
      clerkImage.src = clerkImages[next].src;
      clerkImage.alt = poses[next][1];
      const blink = ['greeting', 'passport', 'signature'].includes(next);
      if (blink && !clerkBlink.hasAttribute('srcset')) clerkBlink.srcset = clerkBlinkSrc;
      if (!blink) clerkBlink.removeAttribute('srcset');
      flightStatus.textContent = view.boardStatus ?? '報到中';
    }
    q('[data-swipe-cue]').hidden = !['approach', 'entry', 'cabinDone', 'result'].includes(next);
    machine.hidden = next !== 'collect';
    q('[data-completion]').hidden = next !== 'complete';
    windowSpot.hidden = next !== 'cabinReady';
    targetArea.hidden = hud.hidden = next !== 'cabinPlay';
    baggage.hidden = next !== 'baggage';
    result.hidden = next !== 'result';
    if (next === 'flights') renderFlightPage();
    if (next === 'greeting') q('[data-ready-passport]').focus({ preventScroll: true });
    if (next === 'result') renderReward();
    if (next !== previous) {
      game.dispatchEvent(new CustomEvent('cinna:check-in-change', {
        bubbles: true, detail: { state: next, previous },
      }));
    }
  }

  function advance(next) {
    if (moving) return;
    if (reduceMotion.matches) {
      setState(next);
      return;
    }
    moving = true;
    game.dataset.moving = '';
    transitionTimer = setTimeout(() => {
      moving = false;
      delete game.dataset.moving;
      setState(next);
    }, 530);
  }

  function bindSlide(surface, phase, direction, onComplete, axis = 'y') {
    let gesture;
    surface.addEventListener('pointerdown', event => {
      if (state !== phase || moving || !event.isPrimary || event.button !== 0) return;
      if (axis === 'y' && event.target.closest('button')) return;
      const capture = axis === 'x' ? event.target : surface;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, capture };
      capture.setPointerCapture(event.pointerId);
    });
    surface.addEventListener('pointermove', event => {
      if (gesture?.id !== event.pointerId || phase !== 'collect') return;
      surface.style.setProperty('--slide', Math.min(96, Math.max(0, event.clientY - gesture.y)) + 'px');
    });
    surface.addEventListener('pointerup', event => {
      if (gesture?.id !== event.pointerId) return;
      const dy = event.clientY - gesture.y;
      const dx = event.clientX - gesture.x;
      clear(event);
      const primary = axis === 'x' ? dx : dy;
      const secondary = axis === 'x' ? dy : dx;
      if (state === phase && Math.abs(primary) >= 42 && Math.abs(primary) > Math.abs(secondary)
          && (!direction || primary * direction > 0)) onComplete(primary);
    });
    function clear(event) {
      if (gesture?.id !== event.pointerId) return;
      const { capture } = gesture;
      gesture = undefined;
      surface.style.removeProperty('--slide');
      if (capture.hasPointerCapture(event.pointerId)) capture.releasePointerCapture(event.pointerId);
    }
    surface.addEventListener('pointercancel', clear);
    surface.addEventListener('lostpointercapture', clear);
  }

  let launchDrag;

  function startJourney() {
    if (state !== 'launch') return;
    setState('mystery');
    chapterTitle.focus({ preventScroll: true });
  }

  launchThumb.addEventListener('pointerdown', event => {
    if (state !== 'launch' || !event.isPrimary || event.button !== 0) return;
    const distance = launch.clientWidth - launchThumb.offsetWidth - 2 * launchThumb.offsetLeft;
    if (distance <= 0) return;
    launchDrag = { id: event.pointerId, start: event.clientX, distance };
    launch.dataset.dragging = '';
    launchThumb.setPointerCapture(event.pointerId);
  });
  launchThumb.addEventListener('pointermove', event => {
    if (launchDrag?.id !== event.pointerId) return;
    const offset = Math.max(0, Math.min(launchDrag.distance, event.clientX - launchDrag.start));
    launch.style.setProperty('--launch-offset', offset + 'px');
  });
  launchThumb.addEventListener('pointerup', event => {
    if (launchDrag?.id !== event.pointerId) return;
    const completed = event.clientX - launchDrag.start >= launchDrag.distance * .9;
    resetLaunchDrag(event);
    if (completed) startJourney();
  });

  function resetLaunchDrag(event) {
    if (launchDrag?.id !== event.pointerId) return;
    launchDrag = undefined;
    delete launch.dataset.dragging;
    launch.style.removeProperty('--launch-offset');
  }

  launchThumb.addEventListener('pointercancel', resetLaunchDrag);
  launchThumb.addEventListener('lostpointercapture', resetLaunchDrag);
  launchThumb.addEventListener('click', event => {
    if (event.detail === 0) startJourney();
  });
  openLetter.addEventListener('click', () => {
    setState('invitation');
    invitationLetter.querySelector('h2').focus({ preventScroll: true });
  });

  acceptInvitation.addEventListener('click', async () => {
    if (state !== 'invitation' || acceptInvitation.disabled) return;
    acceptInvitation.disabled = true;
    pocket.hidden = false;
    pocket.disabled = true;
    game.dataset.stowing = '';

    let stow;
    if (!reduceMotion.matches && typeof invitationPackage.animate === 'function') {
      const mail = invitationPackage.getBoundingClientRect();
      const destination = pocket.getBoundingClientRect();
      const x = destination.x + destination.width / 2 - (mail.x + mail.width / 2);
      const y = destination.y + destination.height / 2 - (mail.y + mail.height / 2);
      stow = invitationPackage.animate([
        { transform: 'none', opacity: 1 },
        { offset: .8, transform: `translate(${x * .91}px,${y * .86}px) scale(.22) rotate(7deg)`, opacity: 1 },
        { transform: `translate(${x}px,${y}px) scale(.09) rotate(9deg)`, opacity: 0 },
      ], { duration: 620, easing: 'cubic-bezier(.45,0,.24,1)', fill: 'forwards' });
      await stow.finished.catch(() => {});
    }
    setState('approach');
    stow?.cancel();

    delete game.dataset.stowing;
    acceptInvitation.disabled = false;
    travel.focus({ preventScroll: true });
  });

  pocket.addEventListener('click', () => {
    if (!pocketDialog.querySelector('.invitation-letter')) {
      const savedInvitation = invitationLetter.cloneNode(true);
      savedInvitation.removeAttribute('data-letter');
      savedInvitation.hidden = false;
      pocketDialog.append(savedInvitation);
    }
    pocketDialog.showModal();
  });
  q('[data-close-invitation]').addEventListener('click', () => pocketDialog.close());

  travel.addEventListener('click', () => advance(state === 'approach' ? 'entry' : 'flights'));
  bindSlide(stage, 'approach', -1, () => advance('entry'));
  bindSlide(stage, 'entry', -1, () => advance('flights'));
  bindSlide(stage, 'cabinDone', -1, () => advance('baggage'));
  bindSlide(stage, 'result', -1, resetJourney);
  bindSlide(printedTicket, 'collect', 1, collectPass);
  flightList.addEventListener('pointerdown', () => { flightSwiped = false; });
  bindSlide(flightList, 'flights', 0, dx => {
    flightSwiped = true;
    moveFlightPage(dx < 0 ? 1 : -1);
  }, 'x');

  function renderFlightSelection() {
    flightRows.forEach((row, index) => row.setAttribute('aria-pressed', index === selectedFlight));
    confirmFlight.disabled = selectedFlight === -1;
    q('[data-flight-feedback]').textContent = '';
  }

  function renderFlightPage() {
    flightRows.forEach((row, index) => {
      flightPages[flightPage][index].forEach((value, column) => { row.children[column].textContent = value; });
    });
    q('[data-flight-page]').textContent = `第 ${flightPage + 1} / ${flightPages.length} 頁`;
    previousFlightPage.disabled = flightPage === 0;
    nextFlightPage.disabled = flightPage === flightPages.length - 1;
    renderFlightSelection();
  }

  function moveFlightPage(direction) {
    const next = flightPage + direction;
    if (next < 0 || next >= flightPages.length) return;
    flightPage = next;
    selectedFlight = -1;
    renderFlightPage();
    if (!reduceMotion.matches) {
      q('[data-flight-rows]').animate([
        { transform: `translateX(${direction * 30}px)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ], { duration: 220, easing: 'ease-out' });
    }
  }

  flightRows.forEach((row, index) => {
    row.addEventListener('click', event => {
      if (flightSwiped && event.detail > 0) return;
      selectedFlight = index;
      renderFlightSelection();
    });
  });
  previousFlightPage.addEventListener('click', () => moveFlightPage(-1));
  nextFlightPage.addEventListener('click', () => moveFlightPage(1));
  confirmFlight.addEventListener('click', () => {
    if (selectedFlight === -1) return;
    if (flightPages[flightPage][selectedFlight][0] !== flight.number) {
      q('[data-flight-feedback]').textContent = '航班編號同邀請函唔相符，再睇清楚。';
      return;
    }
    setState('greeting');
  });
  q('[data-ready-passport]').addEventListener('click', () => {
    setState('passport');
    passport.focus({ preventScroll: true });
  });

  function hitCounter(event) {
    const area = drop.getBoundingClientRect();
    return event.clientX >= area.left && event.clientX <= area.right &&
      event.clientY >= area.top && event.clientY <= area.bottom;
  }

  function clearPassportDrag() {
    const pointer = passportDrag?.id;
    passportDrag = undefined;
    delete stage.dataset.dragging;
    delete passport.dataset.dragging;
    delete drop.dataset.over;
    for (const prop of ['--x', '--y', '--pitch', '--yaw']) passport.style.removeProperty(prop);
    if (pointer !== undefined && passport.hasPointerCapture(pointer)) passport.releasePointerCapture(pointer);
  }

  function submitPassport() {
    if (state !== 'passport') return;
    clearPassportDrag();
    arrivalDetails.reset();
    showArrivalSignature(false);
    setState('signature');
    signature.showModal();
  }

  passport.addEventListener('pointerdown', event => {
    if (state !== 'passport' || !event.isPrimary || event.button !== 0) return;
    passportDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    passport.setPointerCapture(event.pointerId);
  });
  passport.addEventListener('pointermove', event => {
    if (passportDrag?.id !== event.pointerId) return;
    const x = event.clientX - passportDrag.x;
    const y = event.clientY - passportDrag.y;
    if (!passportDrag.moved && Math.hypot(x, y) < 8) return;
    passportDrag.moved = true;
    stage.dataset.dragging = '';
    passport.dataset.dragging = '';
    drop.toggleAttribute('data-over', hitCounter(event));
    passport.style.setProperty('--x', x + 'px');
    passport.style.setProperty('--y', y + 'px');
    passport.style.setProperty('--pitch', Math.max(-17, Math.min(26, 8 - y / 12)) + 'deg');
    passport.style.setProperty('--yaw', Math.max(-23, Math.min(23, 8 + x / 10)) + 'deg');
  });
  passport.addEventListener('pointerup', event => {
    if (passportDrag?.id !== event.pointerId) return;
    const accepted = passportDrag.moved && hitCounter(event);
    clearPassportDrag();
    if (accepted) submitPassport();
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    passport.addEventListener(type, event => {
      if (passportDrag?.id === event.pointerId) clearPassportDrag();
    });
  }
  for (const [control, activate] of [[passport, submitPassport], [printedTicket, collectPass]]) {
    control.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      activate();
    });
  }

  function updateSignature() {
    signatureConfirm.disabled = !hasInk;
  }

  function clearSignature() {
    if (signaturePointer !== undefined && signaturePad.hasPointerCapture(signaturePointer)) {
      signaturePad.releasePointerCapture(signaturePointer);
    }
    signaturePointer = undefined;
    ink?.clearRect(0, 0, signaturePad.width, signaturePad.height);
    hasInk = false;
    updateSignature();
  }

  function signaturePoint(event) {
    const bounds = signaturePad.getBoundingClientRect();
    return [(event.clientX - bounds.left) * signaturePad.width / bounds.width,
      (event.clientY - bounds.top) * signaturePad.height / bounds.height];
  }

  signaturePad.addEventListener('pointerdown', event => {
    if (!ink || !event.isPrimary || event.button !== 0) return;
    signaturePointer = event.pointerId;
    signaturePad.setPointerCapture(event.pointerId);
    ink.beginPath();
    ink.moveTo(...signaturePoint(event));
  });
  signaturePad.addEventListener('pointermove', event => {
    if (event.pointerId !== signaturePointer) return;
    ink.lineCap = ink.lineJoin = 'round';
    ink.strokeStyle = '#246ab0';
    ink.lineWidth = 5;
    ink.lineTo(...signaturePoint(event));
    ink.stroke();
    hasInk = true;
    updateSignature();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    signaturePad.addEventListener(type, event => {
      if (event.pointerId === signaturePointer) signaturePointer = undefined;
    });
  }
  function showArrivalSignature(show) {
    arrivalDetails.hidden = show;
    signatureFields.hidden = !show;
    clearSignature();
  }

  arrivalDetails.addEventListener('submit', event => {
    event.preventDefault();
    if (!passengerInput.value.trim()) {
      passengerInput.value = '';
      passengerInput.reportValidity();
      return;
    }
    showArrivalSignature(true);
    q('[data-edit-details]').focus({ preventScroll: true });
  });
  q('[data-edit-details]').addEventListener('click', () => {
    showArrivalSignature(false);
    passengerInput.focus({ preventScroll: true });
  });
  q('[data-clear-signature]').addEventListener('click', clearSignature);
  signature.addEventListener('cancel', event => event.preventDefault());
  signatureConfirm.addEventListener('click', () => {
    if (state !== 'signature' || signatureConfirm.disabled) return;
    for (const field of game.querySelectorAll('[data-passenger-name]')) field.textContent = passengerInput.value.trim();
    signature.close();
    arrivalDetails.reset();
    clearSignature();
    setState('collect');
    printedTicket.focus({ preventScroll: true });
  });

  flightTrigger.addEventListener('click', () => {
    if (state === 'complete' && ownsPass && !boarding.open) boarding.showModal();
  });

  function collectPass() {
    if (state !== 'collect') return;
    ownsPass = true;
    setState('complete');
    boarding.showModal();
  }

  q('[data-board-plane]').addEventListener('click', () => {
    if (state === 'complete') advance('cabinReady');
  });
  boarding.addEventListener('close', () => {
    if (state === 'complete') q('[data-board-plane]').focus({ preventScroll: true });
  });

  const positions = [[22,25], [70,30], [48,57], [74,63], [30,67], [56,31]];
  function spawnTarget(now) {
    lastSpawn = now;
    const current = Number(target.dataset.slot ?? '-1');
    const next = (current + 1 + Math.floor(Math.random() * (positions.length - 1))) % positions.length;
    const [x, y] = positions[next];
    target.dataset.slot = next;
    target.style.setProperty('--target-x', x + '%');
    target.style.setProperty('--target-y', y + '%');
    const bow = Math.random() < .53;
    targetImage.src = bow ? 'assets/components/previews/bow.webp' : 'assets/components/previews/sparkle.webp';
    target.setAttribute('aria-label', bow ? '收集蝴蝶結' : '收集星星');
    target.hidden = false;
    targetAvailable = true;
    if (document.activeElement === windowSpot || document.activeElement === document.body) {
      target.focus({ preventScroll: true });
    }
  }

  function startCabin() {
    if (state !== 'cabinReady') return;
    catches = 0;
    deadline = performance.now() + cabinDuration;
    q('[data-catches]').textContent = '0';
    setState('cabinPlay');
    spawnTarget(performance.now());
    tickCabin();
    cabinTimer = setInterval(tickCabin, 95);
  }

  function tickCabin() {
    const now = performance.now();
    q('[data-time]').textContent = Math.max(0, Math.ceil((deadline - now) / 1000)) + '秒';
    if (now >= deadline) {
      clearInterval(cabinTimer);
      targetAvailable = false;
      target.hidden = true;
      flightBonus = 100 + Math.min(catches, 10) * 20;
      setState('cabinDone');
      return;
    }
    if (now - lastSpawn >= 1260) spawnTarget(now);
  }

  target.addEventListener('click', () => {
    if (state !== 'cabinPlay' || !targetAvailable || performance.now() >= deadline) return;
    targetAvailable = false;
    target.hidden = true;
    catches += 1;
    q('[data-catches]').textContent = catches;
  });

  for (const bag of baggage.querySelectorAll('[data-bag]')) {
    bag.addEventListener('click', () => {
      if (state !== 'baggage') return;
      luckyBonus = (1 + Math.floor(Math.random() * 5)) * 100;
      try { sessionStorage.setItem(resultKey, JSON.stringify({ flightBonus, luckyBonus })); } catch {}
      setState('result');
    });
  }

  function renderReward() {
    q('[data-base]').textContent = money(baseReward);
    q('[data-flight-bonus]').textContent = money(flightBonus);
    q('[data-lucky-bonus]').textContent = money(luckyBonus);
    q('[data-total]').textContent = money(baseReward + flightBonus + luckyBonus);
  }

  function resetJourney() {
    clearTimeout(transitionTimer);
    clearInterval(cabinTimer);
    moving = false;
    delete game.dataset.moving;
    clearPassportDrag();
    targetAvailable = false;
    target.hidden = true;
    ownsPass = false;
    flightPage = 0;
    selectedFlight = -1;
    catches = flightBonus = luckyBonus = 0;
    try { sessionStorage.removeItem(resultKey); } catch {}
    setState('launch');
    launchThumb.focus({ preventScroll: true });
  }

  windowSpot.addEventListener('click', startCabin);
  boarding.querySelector('[data-close]').addEventListener('click', () => boarding.close());

  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(resultKey)); } catch {}
  if (saved && [100,120,140,160,180,200,220,240,260,280,300].includes(saved.flightBonus)
      && [100,200,300,400,500].includes(saved.luckyBonus)) {
    ({ flightBonus, luckyBonus } = saved);
    ownsPass = true;
    setState('result');
  } else {
    setState('launch');
  }
})();
