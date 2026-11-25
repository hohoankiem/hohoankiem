// Trình phát nhạc kiểu Spotify, phát nhạc từ SoundCloud bằng Widget API (không cần API key).
// Danh sách nguồn nằm ở data/music.json (link bài hát, playlist hoặc trang nghệ sĩ SoundCloud).
const SC_API = "https://w.soundcloud.com/player/api.js";
const PARAMS = "hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false";
const DEFAULT_SOURCES = [
  { id: "toiyeuhanoi", title: "Tôi Yêu Hà Nội!", by: "Hà Nội Phố", url: "https://soundcloud.com/hanoipho/sets/toiyeuhanoi" },
  { id: "hanoihanoi", title: "Hà Nội. Hanoi", by: "Đinh Mạnh Ninh", url: "https://soundcloud.com/hanoipho/hanoihanoi" },
  { id: "troihanoixanh", title: "Trời Hà Nội Xanh", by: "Khánh Linh", url: "https://soundcloud.com/hanoipho/troihanoixanh" },
];

const ICON = {
  play: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="5" width="2.4" height="14" rx="1" fill="currentColor"/><path d="M19 5.7v12.6a.8.8 0 0 1-1.25.66L9 12.66a.8.8 0 0 1 0-1.32l8.75-6.3A.8.8 0 0 1 19 5.7z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="16.6" y="5" width="2.4" height="14" rx="1" fill="currentColor"/><path d="M5 5.7v12.6a.8.8 0 0 0 1.25.66L15 12.66a.8.8 0 0 0 0-1.32L6.25 5.04A.8.8 0 0 0 5 5.7z" fill="currentColor"/></svg>',
  queue: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 6h12M4 11h12M4 16h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M17.5 14v6l5-3z" fill="currentColor"/></svg>',
  vol: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path class="w" d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path class="x" d="M15 9.5l5 5M20 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>',
  note: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M9 18V6l10-2v12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/></svg>',
};

const T = (vi, en) => `<span class="vi">${vi}</span><span class="en">${en}</span>`;
const isEn = () => document.documentElement.lang === "en";
const esc = (t = "") => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const art = (u) => (u ? u.replace("-large", "-t200x200") : null);
const setFill = (input) => input.style.setProperty("--p", ((input.value - input.min) / (input.max - input.min)) * 100 + "%");

let started = false;

export function showPlayer() {
  if (started) return;
  started = true;
  build();
}

async function build() {
  let sources = DEFAULT_SOURCES;
  try {
    const res = await fetch("data/music.json");
    if (res.ok) { const j = await res.json(); if (j.sources?.length) sources = j.sources; }
  } catch {}

  // ---------- DOM ----------
  const bar = document.createElement("div");
  bar.className = "player";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Trình phát nhạc / Music player");
  bar.innerHTML = `
    <div class="pl-info">
      <div class="pl-cover"><img alt="" hidden><span class="pl-ph">${ICON.note}</span></div>
      <div class="pl-meta">
        <div class="pl-title"><span class="pl-title-in">${T("Đang tải nhạc…", "Loading music…")}</span></div>
        <div class="pl-artist">SoundCloud</div>
      </div>
      <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    </div>
    <div class="pl-center">
      <div class="pl-controls">
        <button class="pl-btn pl-prev" type="button" aria-label="Bài trước / Previous">${ICON.prev}</button>
        <button class="pl-play" type="button" aria-label="Phát / Phát tạm dừng / Play / Pause">
          <span class="ic ic-play">${ICON.play}</span><span class="ic ic-pause">${ICON.pause}</span>
        </button>
        <button class="pl-btn pl-next" type="button" aria-label="Bài sau / Next">${ICON.next}</button>
      </div>
      <div class="pl-prog">
        <span class="pl-time pl-cur">0:00</span>
        <input class="pl-range pl-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Tua / Seek">
        <span class="pl-time pl-dur">0:00</span>
      </div>
    </div>
    <div class="pl-side">
      <a class="pl-sc" href="https://soundcloud.com" target="_blank" rel="noopener">${T("Nghe trên SoundCloud", "Listen on SoundCloud")}</a>
      <button class="pl-btn pl-qbtn" type="button" aria-expanded="false" aria-label="Danh sách phát / Playlist">${ICON.queue}</button>
      <div class="pl-vol">
        <button class="pl-btn pl-mute" type="button" aria-label="Tắt tiếng / Mute">${ICON.vol}</button>
        <input class="pl-range pl-volume" type="range" min="0" max="100" value="60" aria-label="Âm lượng / Volume">
      </div>
    </div>`;

  const queue = document.createElement("div");
  queue.className = "pl-queue";
  queue.innerHTML = `
    <div class="pl-qhead"><b>${T("Danh sách phát", "Playlist")}</b><div class="pl-chips"></div></div>
    <ul class="pl-list"></ul>
    <p class="pl-note">${T("Nhạc phát từ SoundCloud, thuộc về nghệ sĩ và người đăng tải.", "Music streams from SoundCloud and belongs to the artists and uploaders.")}</p>`;
  const toast = document.createElement("div");
  toast.className = "pl-toast";
  toast.setAttribute("role", "status");
  const frame = document.createElement("iframe");
  frame.className = "pl-frame";
  frame.title = "SoundCloud";
  frame.allow = "autoplay";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(sources[0].url)}&${PARAMS}`;
  document.body.append(bar, queue, toast, frame);

  const $ = (s) => bar.querySelector(s);
  const cover = $(".pl-cover"), img = cover.querySelector("img"), ph = $(".pl-ph");
  const titleIn = $(".pl-title-in"), artistEl = $(".pl-artist"), scLink = $(".pl-sc");
  const playBtn = $(".pl-play"), seek = $(".pl-seek"), curEl = $(".pl-cur"), durEl = $(".pl-dur");
  const volume = $(".pl-volume"), muteBtn = $(".pl-mute"), qBtn = $(".pl-qbtn");
  const chips = queue.querySelector(".pl-chips"), list = queue.querySelector(".pl-list");

  document.documentElement.classList.add("player-on");
  requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add("show")));

  // ---------- trạng thái ----------
  let widget = null, ready = false, si = 0, sounds = [], idx = 0, dur = 0;
  let playing = false, wantPlay = false, seeking = false, errors = 0, lastVol = 60;
  try { const v = localStorage.getItem("plvol"); if (v !== null) volume.value = v; } catch {}
  setFill(volume); setFill(seek);

  const say = (vi, en) => {
    toast.innerHTML = T(vi, en);
    toast.classList.add("show");
    clearTimeout(say.t);
    say.t = setTimeout(() => toast.classList.remove("show"), 3800);
  };

  function setPlaying(v) {
    playing = v;
    bar.classList.toggle("playing", v);
    queue.classList.toggle("playing", v);
    playBtn.setAttribute("aria-pressed", String(v));
  }

  function renderQueue() {
    chips.innerHTML = sources.map((s, i) => `<button type="button" class="pl-chip${i === si ? " on" : ""}" data-i="${i}">${esc(s.title)}</button>`).join("");
    list.innerHTML = sounds.length
      ? sounds.map((s, i) => {
          const a = art(s.artwork_url);
          return `<li class="pl-row${i === idx ? " on" : ""}" data-i="${i}" style="--i:${i}" tabindex="0" role="button">
            <span class="pl-n"><b>${i + 1}</b><span class="eq mini"><i></i><i></i><i></i><i></i></span></span>
            <i class="pl-th"${a ? ` style="background-image:url('${esc(a)}')"` : ""}></i>
            <span class="pl-rt"><b>${esc(s.title)}</b><small>${esc(s.user?.username || "")}</small></span>
            <time>${fmt(s.duration || 0)}</time></li>`;
        }).join("")
      : `<li class="pl-empty">${T("Đang tải danh sách…", "Loading the list…")}</li>`;
  }

  function fitTitle() {
    titleIn.classList.remove("scroll");
    titleIn.style.removeProperty("--m");
    requestAnimationFrame(() => {
      const over = titleIn.scrollWidth - titleIn.parentElement.clientWidth;
      if (over > 4) { titleIn.style.setProperty("--m", `-${over + 8}px`); titleIn.classList.add("scroll"); }
    });
  }

  function showSound(s) {
    if (!s) return;
    dur = s.duration || dur;
    titleIn.textContent = s.title || "—";
    artistEl.textContent = s.user?.username || "";
    const a = art(s.artwork_url) || s.user?.avatar_url;
    if (a) { img.src = a; img.hidden = false; ph.hidden = true; } else { img.hidden = true; ph.hidden = false; }
    scLink.href = s.permalink_url || "https://soundcloud.com";
    durEl.textContent = fmt(dur);
    fitTitle();
    [titleIn, artistEl, cover].forEach((e, i) =>
      e.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: i * 60, easing: "cubic-bezier(.2,.7,.2,1)" }));
    list.querySelectorAll(".pl-row").forEach((r, i) => r.classList.toggle("on", i === idx));
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: s.title || "", artist: s.user?.username || "", album: "Hồ Hoàn Kiếm",
          artwork: a ? [{ src: a, sizes: "200x200" }] : [],
        });
      } catch {}
    }
  }

  function syncNow() {
    widget.getCurrentSoundIndex((i) => { idx = i || 0; showSound(sounds[idx]); });
  }

  function refresh() {
    widget.getSounds((l) => {
      sounds = Array.isArray(l) ? l : [];
      if (!sounds.length) {
        widget.getCurrentSound((s) => { if (s) sounds = [s]; renderQueue(); syncNow(); });
      } else { renderQueue(); syncNow(); }
    });
  }

  function loadSource(i, auto) {
    si = ((i % sources.length) + sources.length) % sources.length;
    sounds = []; idx = 0;
    renderQueue();
    widget.load(sources[si].url, {
      auto_play: !!auto, hide_related: true, show_comments: false, show_user: false,
      show_reposts: false, show_teaser: false, visual: false,
      callback: () => { widget.setVolume(+volume.value); refresh(); },
    });
  }

  function failed() {
    errors++;
    if (errors >= sources.length) {
      say("Không phát được nhạc từ SoundCloud lúc này.", "Can't play music from SoundCloud right now.");
      setPlaying(false); wantPlay = false; errors = 0;
    } else {
      say("Bài này không phát được, chuyển sang nguồn khác.", "This one can't play, switching source.");
      loadSource(si + 1, wantPlay);
    }
  }

  // ---------- SoundCloud Widget ----------
  function bindWidget() {
    const E = window.SC.Widget.Events;
    widget = window.SC.Widget(frame);
    widget.bind(E.READY, () => {
      ready = true;
      widget.setVolume(+volume.value);
      refresh();
      if (wantPlay) widget.play();
    });
    widget.bind(E.PLAY, () => { errors = 0; wantPlay = true; setPlaying(true); syncNow(); });
    widget.bind(E.PAUSE, () => setPlaying(false));
    widget.bind(E.FINISH, () => {
      if (idx >= sounds.length - 1) loadSource(si + 1, true);
    });
    widget.bind(E.PLAY_PROGRESS, (d) => {
      if (seeking) return;
      const pos = d.currentPosition || 0;
      curEl.textContent = fmt(pos);
      if (dur) { seek.value = Math.min(1000, (pos / dur) * 1000); setFill(seek); }
    });
    widget.bind(E.ERROR, failed);
  }

  const sdk = new Promise((res, rej) => {
    if (window.SC?.Widget) return res();
    const s = document.createElement("script");
    s.src = SC_API; s.onload = res; s.onerror = rej;
    document.head.append(s);
  });
  sdk.then(bindWidget).catch(() => {
    say("Không tải được SoundCloud. Kiểm tra kết nối mạng.", "Couldn't load SoundCloud. Check your connection.");
    titleIn.textContent = isEn() ? "Music unavailable" : "Chưa tải được nhạc";
  });

  // ---------- điều khiển ----------
  playBtn.addEventListener("click", () => {
    bar.classList.add("touched");
    wantPlay = !playing;
    if (!ready) return; // sẽ phát khi widget sẵn sàng
    widget.toggle();
  });
  $(".pl-next").addEventListener("click", () => {
    if (!ready) return;
    if (idx < sounds.length - 1) { widget.next(); setTimeout(() => widget.play(), 200); }
    else loadSource(si + 1, true);
  });
  $(".pl-prev").addEventListener("click", () => {
    if (!ready) return;
    widget.getPosition((pos) => {
      if (pos > 3000) widget.seekTo(0);
      else if (idx > 0) { widget.prev(); setTimeout(() => widget.play(), 200); }
      else loadSource(si - 1, true);
    });
  });

  seek.addEventListener("input", () => { seeking = true; setFill(seek); curEl.textContent = fmt((seek.value / 1000) * dur); });
  seek.addEventListener("change", () => { if (ready && dur) widget.seekTo((seek.value / 1000) * dur); seeking = false; });

  function applyVolume() {
    setFill(volume);
    muteBtn.classList.toggle("muted", +volume.value === 0);
    if (ready) widget.setVolume(+volume.value);
    try { localStorage.setItem("plvol", volume.value); } catch {}
  }
  volume.addEventListener("input", () => { if (+volume.value > 0) lastVol = +volume.value; applyVolume(); });
  muteBtn.addEventListener("click", () => { volume.value = +volume.value === 0 ? lastVol : 0; applyVolume(); });
  applyVolume();

  // Hàng đợi
  const toggleQueue = (open) => {
    const v = open ?? !queue.classList.contains("open");
    queue.classList.toggle("open", v);
    qBtn.setAttribute("aria-expanded", String(v));
    qBtn.classList.toggle("on", v);
  };
  qBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleQueue(); });
  document.addEventListener("click", (e) => { if (!queue.contains(e.target) && !bar.contains(e.target)) toggleQueue(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleQueue(false); });
  queue.addEventListener("click", (e) => {
    const chip = e.target.closest(".pl-chip");
    if (chip) { loadSource(+chip.dataset.i, playing || wantPlay); return; }
    const row = e.target.closest(".pl-row");
    if (row && ready) { widget.skip(+row.dataset.i); setTimeout(() => widget.play(), 250); }
  });
  queue.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("pl-row")) e.target.click(); });

  if ("mediaSession" in navigator) {
    const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch {} };
    set("play", () => ready && widget.play());
    set("pause", () => ready && widget.pause());
    set("nexttrack", () => $(".pl-next").click());
    set("previoustrack", () => $(".pl-prev").click());
  }
  addEventListener("resize", fitTitle);
}
