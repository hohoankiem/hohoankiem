// "Swarm rebuild": giao diện bị xóa trắng, rồi hàng chục con trỏ ảo bay tới, kéo khung,
// gõ chữ và căn chỉnh từng lớp để dựng lại màn hình đầu trang. Bấm "Bỏ qua" hoặc Esc để dừng.
import { showHero } from "./motion.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
let running = false;

const NAMES = ["Minh", "Lan", "Hà", "Quân", "Linh", "Đức", "Mai", "Tùng", "Hương", "Nam", "Thảo", "Khoa", "Vy", "Bảo",
  "Trang", "Huy", "An", "Phúc", "Ngọc", "Sơn", "Yến", "Long", "Hạnh", "Dũng", "Thu", "Việt", "Châu", "Kiên"];
const EASE = "cubic-bezier(.2,.7,.2,1)";
const SNAP = "cubic-bezier(.34,1.56,.64,1)";
const CURSOR_SVG = '<svg viewBox="0 0 16 22" width="16" height="22"><path d="M1 1v16.5l4.4-4 3.3 7.3 3-1.4-3.2-7.1 6-.3z" fill="var(--c)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';

// start = mốc (ms) con trỏ bắt đầu làm lớp này
const TASKS = [
  { sel: ".hero .photo", box: ".hero", kind: "image", start: 0 },
  { sel: ".nav", kind: "nav", start: 900 },
  { sel: ".hero h1", kind: "text", tight: true, start: 1300 },
  { sel: ".hero-text p", kind: "text", tight: true, start: 1900 },
  { sel: ".hero-text .btn", kind: "text", start: 2600 },
  { sel: ".hero .vertical", kind: "text", start: 3000 },
];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
const plain = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });

export function startRebuild(onDone, { delay = 1100 } = {}) {
  if (reduce || running || !document.querySelector(".hero")) return false;
  running = true;
  root.classList.add("splash-open"); // khóa cuộn trong lúc dựng
  showHero();
  run(onDone, delay);
  return true;
}

async function run(onDone, delay) {
  let alive = true, live = true;
  const W = innerWidth, H = innerHeight;
  const anims = [];
  const A = (e, kf, opts) => { const a = e.animate(kf, opts); anims.push(a); return a; };
  const sleep = (ms) => new Promise((res) => setTimeout(res, alive ? ms : 0));

  const overlay = el("div", "rb-layer");
  overlay.innerHTML = `<div class="rb-bar"><span class="rb-dot"></span>
    <span class="rb-msg"><span class="vi">${NAMES.length} con trỏ đang dựng lại giao diện…</span><span class="en">${NAMES.length} cursors are rebuilding the interface…</span></span>
    <button class="rb-skip" type="button"><span class="vi">Bỏ qua</span><span class="en">Skip</span></button></div>`;
  document.body.append(overlay);
  const skip = () => { alive = false; };
  overlay.querySelector(".rb-skip").addEventListener("click", skip);
  const onKey = (e) => { if (e.key === "Escape") skip(); };
  document.addEventListener("keydown", onKey);

  // Đo vị trí các lớp cần dựng khi giao diện còn nguyên
  const tasks = TASKS.map((t) => {
    const e = document.querySelector(t.sel);
    if (!e || !e.getClientRects().length) return null;
    const full = plain((document.querySelector(t.box || t.sel)).getBoundingClientRect());
    let rect = full;
    if (t.tight) {
      const rg = document.createRange();
      rg.selectNodeContents(e);
      rect = plain(rg.getBoundingClientRect());
    }
    if (t.kind === "text") { e.style.minHeight = full.height + "px"; e.style.minWidth = full.width + "px"; }
    return { ...t, e, rect, text: e.textContent };
  }).filter(Boolean);

  // ---------- con trỏ ----------
  let cursors = [];
  function spawn(i) {
    const color = `hsl(${Math.round((i * 360) / NAMES.length)} 78% 40%)`;
    const e = el("div", "rb-cur");
    e.style.setProperty("--c", color);
    e.style.setProperty("--d", rand(0, 0.7).toFixed(2) + "s");
    e.innerHTML = CURSOR_SVG + "<span></span>";
    e.querySelector("span").textContent = NAMES[i];
    overlay.append(e);
    const side = Math.floor(rand(0, 4));
    const x = side === 1 ? W + 40 : side === 3 ? -40 : rand(0, W);
    const y = side === 0 ? -40 : side === 2 ? H + 40 : rand(0, H);
    return { e, color, x, y, tx: rand(40, W - 80), ty: rand(60, H - 80), k: 0.06, eps: 3, busy: false, wait: null, frame: null };
  }

  function drawFrame(c) {
    const f = c.frame, a = f.anchor;
    const x = Math.min(a.x, c.x), y = Math.min(a.y, c.y), w = Math.abs(c.x - a.x), h = Math.abs(c.y - a.y);
    f.el.style.transform = `translate(${x}px,${y}px)`;
    f.el.style.width = w + "px";
    f.el.style.height = h + "px";
    f.sz.textContent = `${Math.round(w)} × ${Math.round(h)}`;
  }

  let raf = 0, last = performance.now();
  function tick(now) {
    if (!live) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(3, (now - last) / 16.67);
    last = now;
    for (const c of cursors) {
      const f = 1 - Math.pow(1 - c.k, dt);
      c.x += (c.tx - c.x) * f;
      c.y += (c.ty - c.y) * f;
      c.e.style.transform = `translate3d(${c.x}px,${c.y}px,0)`;
      if (c.frame) drawFrame(c);
      if (c.wait && Math.hypot(c.tx - c.x, c.ty - c.y) < c.eps) { const r = c.wait; c.wait = null; r(); }
    }
  }

  const moveTo = (c, x, y, k = 0.09, eps = 3) => new Promise((res) => { c.tx = x; c.ty = y; c.k = k; c.eps = eps; c.wait = res; });
  async function fly(c, x, y) {
    await moveTo(c, (c.x + x) / 2 + rand(-120, 120), (c.y + y) / 2 + rand(-100, 100), 0.07, 40);
    if (alive) await moveTo(c, x, y, 0.1, 2);
  }

  function makeFrame(c, ghost) {
    const f = el("div", "rb-frame" + (ghost ? " ghost" : ""));
    f.style.setProperty("--c", c.color);
    f.innerHTML = '<i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><b class="sz"></b>';
    overlay.append(f);
    c.frame = { el: f, anchor: { x: c.x, y: c.y }, sz: f.querySelector(".sz") };
    return f;
  }

  function guides(r) {
    const g = el("div", "rb-guides");
    const line = (css) => { const i = el("i"); i.style.cssText = css; g.append(i); };
    line(`left:${r.left}px;top:0;width:1px;height:100%`);
    line(`left:${r.right}px;top:0;width:1px;height:100%`);
    line(`top:${r.top}px;left:0;height:1px;width:100%`);
    line(`top:${r.bottom}px;left:0;height:1px;width:100%`);
    overlay.append(g);
    setTimeout(() => { g.classList.add("out"); setTimeout(() => g.remove(), 320); }, 700);
  }

  // Con trỏ "đi dạo" và thỉnh thoảng kéo thử một khung rồi bỏ
  async function ghost(c) {
    c.busy = true;
    const f = makeFrame(c, true);
    await moveTo(c, clamp(c.x + rand(-260, 260), 20, W - 40), clamp(c.y + rand(-160, 200), 60, H - 40), 0.08, 3);
    await sleep(rand(200, 500));
    f.classList.add("out");
    await sleep(260);
    f.remove(); c.frame = null; c.busy = false;
  }
  async function wander(c) {
    await sleep(rand(0, 600));
    while (alive) {
      if (c.busy) { await sleep(150); continue; }
      if (Math.random() < 0.35) await ghost(c);
      else await moveTo(c, rand(30, W - 60), rand(60, H - 60), rand(0.03, 0.07), 20);
      await sleep(rand(100, 500));
    }
  }

  // ---------- đặt từng loại lớp ----------
  async function placeImage(t) {
    root.classList.remove("rb-nograd"); // lớp gradient tối ở đáy hero hiện lại dần
    t.e.classList.add("rb-on");
    await A(t.e, [
      { opacity: 0, filter: "blur(18px) saturate(0)", clipPath: "inset(0 0 100% 0)" },
      { opacity: 1, filter: "blur(0) saturate(1)", clipPath: "inset(0 0 0% 0)" },
    ], { duration: 950, easing: EASE }).finished.catch(() => {});
  }

  async function placeNav(t) {
    t.e.classList.add("rb-on");
    const parts = [...t.e.querySelectorAll(".brand, nav, nav a, .lang-btn")];
    parts.forEach((p) => p.classList.add("rb-on"));
    await Promise.all(parts.map((p, i) => A(p, [
      { opacity: 0, transform: "translateY(-16px)" }, { opacity: 1, transform: "none" },
    ], { duration: 600, delay: i * 90, easing: SNAP, fill: "backwards" }).finished.catch(() => {})));
  }

  async function placeText(c, t) {
    const e = t.e, r = t.rect, vertical = r.height > r.width * 2;
    e.classList.add("rb-on", "rb-typing");
    A(e, { translate: [`${rand(-18, 18)}px ${rand(-12, 12)}px`, "0px 0px"] }, { duration: 800, easing: SNAP });
    const dur = Math.min(2300, 28 * t.text.length + 300), t0 = performance.now();
    await new Promise((res) => {
      const step = () => {
        if (!alive) return res();
        const p = Math.min(1, (performance.now() - t0) / dur);
        e.textContent = t.text.slice(0, Math.floor(p * t.text.length));
        c.k = 0.2;
        if (vertical) { c.tx = r.left - 14; c.ty = r.top + p * r.height; }
        else { c.tx = r.left + p * r.width; c.ty = r.bottom + 12; }
        p < 1 ? requestAnimationFrame(step) : res();
      };
      step();
    });
    e.textContent = t.text;
    e.classList.remove("rb-typing");
  }

  async function build(c, t) {
    await sleep(t.start);
    if (!alive) return;
    c.busy = true;
    const r = t.rect;
    await fly(c, r.left, r.top);
    if (!alive) return;
    const f = makeFrame(c);
    if (r.bottom > H - 50) f.classList.add("big");
    await moveTo(c, r.right, r.bottom, 0.12, 2);
    if (!alive) return;
    c.x = c.tx = r.right; c.y = c.ty = r.bottom; drawFrame(c);
    f.classList.add("locked");
    guides(r);
    if (t.kind === "image") await placeImage(t);
    else if (t.kind === "nav") await placeNav(t);
    else await placeText(c, t);
    f.classList.add("out");
    await sleep(260);
    f.remove(); c.frame = null; c.busy = false;
    wander(c);
  }

  // ---------- xóa trắng ----------
  async function wipe() {
    root.classList.add("rb-nograd");
    const order = [".hero .vertical", ".hero-text .btn", ".hero-text p", ".hero h1", ".nav", ".hero .photo"];
    const out = order.map((sel, i) => {
      const e = document.querySelector(sel);
      return e && e.getClientRects().length
        ? A(e, [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }], { duration: 380, delay: i * 80, fill: "forwards", easing: "ease-in" })
        : null;
    }).filter(Boolean);
    await Promise.all(out.map((a) => a.finished.catch(() => {})));
    root.classList.add("rebuild");
    out.forEach((a) => a.cancel());
  }

  // ---------- kết thúc / khôi phục ----------
  async function finish() {
    alive = false;
    document.removeEventListener("keydown", onKey);
    cursors.forEach((c) => { if (c.wait) { const r = c.wait; c.wait = null; r(); } });
    anims.forEach((a) => a.cancel());
    tasks.forEach((t) => {
      t.e.style.minHeight = t.e.style.minWidth = "";
      if (t.kind === "text") t.e.textContent = t.text;
    });
    document.querySelectorAll(".rb-on, .rb-typing").forEach((e) => e.classList.remove("rb-on", "rb-typing"));
    root.classList.remove("rebuild", "rb-nograd");
    overlay.querySelectorAll(".rb-frame, .rb-guides, .rb-bar").forEach((e) => e.remove());
    overlay.classList.add("leaving"); // con trỏ mờ dần và bay ra ngoài
    cursors.forEach((c) => { c.k = 0.07; c.tx = c.x < W / 2 ? -60 : W + 60; c.ty = c.y + rand(-80, 80); });
    await new Promise((res) => setTimeout(res, 700));
    live = false;
    cancelAnimationFrame(raf);
    overlay.remove();
    root.classList.remove("splash-open");
    running = false;
    onDone?.();
  }

  await sleep(delay);
  if (alive) { await wipe(); await sleep(300); }
  if (alive) {
    cursors = NAMES.map((_, i) => spawn(i));
    raf = requestAnimationFrame(tick);
    cursors.slice(tasks.length).forEach(wander);
    await Promise.all(tasks.map((t, i) => build(cursors[i], t)));
    await sleep(600);
  }
  await finish();
}
