(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem('portal.theme');
  const preferredDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const apply = dark => {
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('[data-theme-toggle]')?.setAttribute('aria-pressed', String(dark));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#081527' : '#f5f7fb');
  };
  apply(stored ? stored === 'dark' : preferredDark);
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    localStorage.setItem('portal.theme', dark ? 'dark' : 'light');
    apply(dark);
  });
  const video = document.querySelector('[data-tutorial-video]');
  const toggle = document.querySelector('[data-video-toggle]');
  const toggleLabel = document.querySelector('[data-video-toggle-label]');
  const time = document.querySelector('[data-video-time]');
  const formatTime = value => {
    if (!Number.isFinite(value)) return '00:00';
    const seconds = Math.max(0, Math.floor(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const updatePlayback = () => {
    if (!video) return;
    const playing = !video.paused && !video.ended;
    const action = playing ? 'Pausar' : 'Reproducir';
    if (toggleLabel) toggleLabel.textContent = action;
    if (toggle) {
      toggle.setAttribute('aria-label', `${action} video`);
      toggle.title = `${action} video`;
    }
    if (time) time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  };
  document.querySelectorAll('[data-video-skip]').forEach(button => {
    button.addEventListener('click', () => {
      if (!video) return;
      const next = video.currentTime + Number(button.dataset.videoSkip || 0);
      video.currentTime = Math.min(Number.isFinite(video.duration) ? video.duration : next, Math.max(0, next));
      updatePlayback();
    });
  });
  toggle?.addEventListener('click', () => {
    if (!video) return;
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  });
  video?.addEventListener('loadedmetadata', updatePlayback);
  video?.addEventListener('timeupdate', updatePlayback);
  video?.addEventListener('play', updatePlayback);
  video?.addEventListener('pause', updatePlayback);
  video?.addEventListener('ended', updatePlayback);
  updatePlayback();
})();
