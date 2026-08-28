(async () => {
  const publicTutorial = document.body.dataset.tutorialPublic === 'true';
  const session = (() => {
    try { return JSON.parse(localStorage.getItem('portal.session') || 'null'); } catch { return null; }
  })();
  const guestReview = (() => {
    try { return sessionStorage.getItem('portal.guestReview') === '1'; } catch { return false; }
  })();
  const requiredAccess = document.body.dataset.tutorialAccess || 'student';
  const effectiveRole = guestReview ? 'jefatura' : String(session?.accessMode || session?.role || '');
  const accessAllowed = (guestReview || Boolean(session?.sessionToken)) && (
    requiredAccess === 'student'
    || (requiredAccess === 'ceal' && ['ceal', 'jefatura'].includes(effectiveRole))
    || (requiredAccess === 'jefatura' && effectiveRole === 'jefatura')
  );
  const returnToPortal = () => location.replace('../#/tutoriales');
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  const apiBase = isLocal ? `${location.origin}/api` : String(window.PORTAL_API_BASE || '');
  if (!publicTutorial && !accessAllowed) {
    returnToPortal();
    return;
  }
  if (!publicTutorial && apiBase && !guestReview && !(isLocal && session.authProvider === 'local-dev')) {
    try {
      const response = await fetch(`${apiBase}/auth/session`, {
        cache: 'no-store',
        headers: { accept: 'application/json', Authorization: `Bearer ${session.sessionToken}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.user?.sessionToken) {
        localStorage.removeItem('portal.session');
        returnToPortal();
        return;
      }
    } catch {
      // Una caída temporal del API no bloquea un tutorial ya autorizado localmente.
    }
  }
  document.documentElement.classList.remove('tutorial-auth-pending');

  const root = document.documentElement;
  const stored = localStorage.getItem('portal.theme');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const applyTheme = dark => {
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'only light';
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', `Cambiar a modo ${dark ? 'claro' : 'oscuro'}`);
      themeButton.innerHTML = dark
        ? '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>'
        : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 15.2A8.5 8.5 0 0 1 8.8 3.2 8.5 8.5 0 1 0 20.8 15.2Z"/></svg>';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#081527' : '#f5f7fb');
  };
  applyTheme(stored === 'dark');
  themeButton?.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    localStorage.setItem('portal.theme', dark ? 'dark' : 'light');
    applyTheme(dark);
  });

  const appointmentLink = document.querySelector('a[href*="#/atencion"]');
  if (appointmentLink && apiBase) {
    let warmupStarted = false;
    const warmup = () => {
      if (warmupStarted) return;
      warmupStarted = true;
      fetch(`${apiBase}/health`, { cache: 'no-store', mode: 'cors' }).catch(() => {});
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(warmup, { timeout: 1200 });
    else setTimeout(warmup, 250);
    appointmentLink.addEventListener('pointerenter', warmup, { once: true });
    appointmentLink.addEventListener('focus', warmup, { once: true });
  }

  const player = document.querySelector('[data-video-player]');
  const video = player?.querySelector('[data-tutorial-video]');
  if (!player || !video) return;

  const download = document.querySelector('[data-video-download]');
  const voiceButtons = [...document.querySelectorAll('[data-video-voice]')];
  let activeVoice = 'female';

  voiceButtons.forEach(button => {
    button.addEventListener('click', () => {
      const voice = button.dataset.videoVoice;
      if (!voice || voice === activeVoice) return;
      const source = voice === 'male' ? player.dataset.videoMale : player.dataset.videoFemale;
      if (!source) return;
      const currentTime = video.currentTime;
      const wasPlaying = !video.paused && !video.ended;
      const muted = video.muted;
      const volume = video.volume;
      const playbackRate = video.playbackRate;
      activeVoice = voice;
      voiceButtons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.videoVoice === voice)));
      video.pause();
      video.src = source;
      video.load();
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(currentTime, Number.isFinite(video.duration) ? video.duration : currentTime);
        video.muted = muted;
        video.volume = volume;
        video.playbackRate = playbackRate;
        if (wasPlaying) video.play().catch(() => {});
      }, { once: true });
      if (download) download.href = source;
    });
  });
})();
