// Animation chuyển động + cuộn trang (vanilla JS, Web Animations API).
// Lấy cảm hứng từ Animate UI: spring, blur-rise, stagger, magnetic. Không đổi bố cục/giao diện.
window.__motion = 1; // báo cho đoạn fallback trong <head> biết module đã nạp

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const REVEAL = ".legend-text>*, .places>h2, .place>div>*, .gallery>h2, .visit>h2, .visit li, .map-text>*, footer p, footer ul";
const HERO = ".hero-text>*, .hero .vertical";
const EASE = "cubic-bezier(.2,.7,.2,1)";

// Easing dạng spring (CSS linear()) tính từ vật lý lò xo
function makeSpring(k = 120, c = 14, n = 48) {
  const w0 = Math.sqrt(k), z = c / (2 * w0), wd = w0 * Math.sqrt(1 - z * z);
  const T = 6 / (z * w0);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * T;
    const x = 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    return +x.toFixed(4);
  });
  const ok = CSS.supports("animation-timing-function", "linear(0, 1)");
  return { easing: ok ? `linear(${pts.join(",")})` : "cubic-bezier(.34,1.56,.64,1)", ms: Math.round(T * 1000) };
}
const SPRING = makeSpring();

function finish(el, anim) {
  anim.finished.then(() => { el.classList.add("in"); anim.cancel(); }).catch(() => {});
}

function rise(el, delay = 0, dist = 28) {
  finish(el, el.animate(
    [{ opacity: 0, transform: `translateY(${dist}px)`, filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
    { duration: 900, delay, easing: EASE, fill: "both" }
  ));
}

function wipe(el, delay = 0) {
  finish(el, el.animate(
    [{ clipPath: "inset(100% 0 0 0)", opacity: 1 }, { clipPath: "inset(0% 0 0 0)", opacity: 1 }],
    { duration: 1200, delay, easing: "cubic-bezier(.65,0,.35,1)", fill: "both" }
  ));
  const photo = el.querySelector(".photo");
  if (photo) {
    const a = photo.animate({ scale: ["1.4", "1.12"] }, { duration: 1700, delay, easing: EASE, fill: "both" });
    a.finished.then(() => a.cancel()).catch(() => {});
  }
}

function pop(el, delay = 0) {
  finish(el, el.animate(
    [{ opacity: 0, transform: "translateY(30px) scale(.88)" }, { opacity: 1, transform: "none" }],
    { duration: SPRING.ms, delay, easing: SPRING.easing, fill: "both" }
  ));
}

function play(el, delay) {
  if (el.matches(".frame")) wipe(el, delay);
  else if (el.matches(".g")) pop(el, delay);
  else rise(el, delay);
}

export function playHero(delay = 0) {
  if (reduce) return;
  document.querySelectorAll(HERO).forEach((el, i) => rise(el, delay + 150 + i * 160, 40));
  document.querySelector(".nav")?.animate(
    [{ transform: "translateY(-100%)", opacity: 0 }, { transform: "none", opacity: 1 }],
    { duration: 900, delay, easing: EASE }
  );
}

function setupReveal() {
  const targets = document.querySelectorAll(`${REVEAL}, .frame, .g`);
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (a.target.compareDocumentPosition(b.target) & 4 ? -1 : 1))
      .forEach((e, i) => { io.unobserve(e.target); play(e.target, Math.min(i, 6) * 90); });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  targets.forEach((el) => io.observe(el));
}

function setupParallax() {
  const heroPhoto = document.querySelector(".hero .photo");
  const heroText = document.querySelector(".hero-text");
  const photos = [...document.querySelectorAll(".frame .photo")];
  let ticking = false;

  function update() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (y < vh * 1.3) {
      heroPhoto?.style.setProperty("--hy", `${y * 0.28}px`);
      if (heroText) {
        heroText.style.translate = `0 ${y * 0.18}px`;
        heroText.style.opacity = Math.max(0, 1 - y / (vh * 0.75));
      }
    }
    for (const p of photos) {
      const r = p.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      const lim = r.height * 0.06;
      p.style.setProperty("--py", `${Math.max(-lim, Math.min(lim, -off * r.height * 0.1))}px`);
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

function setupMagnetic() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(".btn, .lang-btn").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.translate = `${x}px ${y}px`;
    });
    el.addEventListener("pointerleave", () => {
      const from = el.style.translate || "0px 0px";
      el.style.translate = "";
      el.animate({ translate: [from, "0px 0px"] }, { duration: SPRING.ms, easing: SPRING.easing });
    });
  });
}

export function initMotion() {
  if (reduce) return;
  document.documentElement.classList.add("motion");
  setupReveal();
  setupParallax();
  setupMagnetic();
}
