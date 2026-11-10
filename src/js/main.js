import { EN } from "./i18n.js";
import { initMotion, playHero } from "./motion.js";
// Nạp ảnh từ data/images.json (do scripts/fetch-images.mjs tạo ra)
const credits = new Map();

async function loadManifest() {
  try {
    const res = await fetch("data/images.json");
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

function esc(t = "") {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const providers = new Map();

function applyImages(manifest) {
  document.querySelectorAll("[data-img]").forEach((el) => {
    const item = manifest[el.dataset.img];
    if (!item) return;
    el.style.backgroundColor = item.color;
    el.style.backgroundImage = `url("${item.src}")`;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", item.alt);
    el.dataset.full = item.src;
    credits.set(`${item.photographer}|${item.provider}`, item);
    providers.set(item.provider, item.providerUrl);
  });

  document.querySelectorAll("[data-credit]").forEach((cap) => {
    const item = manifest[cap.dataset.credit];
    if (!item) return;
    const a = `<a href="${esc(item.pageUrl)}" target="_blank" rel="noopener">${esc(item.photographer)}</a>`;
    cap.innerHTML = `<span class="vi">Ảnh: ${a} / ${esc(item.provider)}</span><span class="en">Photo: ${a} / ${esc(item.provider)}</span>`;
  });

  const list = document.getElementById("credits");
  credits.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${esc(item.photographerUrl)}" target="_blank" rel="noopener">${esc(item.photographer)}</a> (${esc(item.provider)})`;
    list.append(li);
  });

  if (providers.size) {
    const links = [...providers].map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(", ");
    document.getElementById("providers").innerHTML = `<span class="vi">Ảnh từ ${links}.</span><span class="en">Photos from ${links}.</span>`;
  }
}

function setupLightbox() {
  const box = document.getElementById("lightbox");
  const img = box.querySelector("img");
  document.querySelectorAll(".g").forEach((fig) => {
    const photo = fig.querySelector(".photo");
    fig.tabIndex = 0;
    const open = () => {
      if (!photo.dataset.full) return;
      img.src = photo.dataset.full;
      img.alt = photo.getAttribute("aria-label") || "";
      box.showModal();
    };
    fig.addEventListener("click", open);
    fig.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
  });
  box.addEventListener("click", (e) => e.target === box && box.close());
}

applyImages(await loadManifest());
setupLightbox();

// Song ngữ Việt / Anh
const TITLES = {
  vi: "Hồ Hoàn Kiếm – Hồ Gươm giữa lòng Hà Nội",
  en: "Hoan Kiem Lake – the Sword Lake in the heart of Hanoi",
};
const targets = [...document.querySelectorAll("body *")].filter(
  (el) => !el.children.length && EN[el.textContent.trim()]
);
targets.forEach((el) => (el.dataset.vi = el.textContent.trim()));

function setLang(lang) {
  document.documentElement.lang = lang;
  document.title = TITLES[lang];
  targets.forEach((el) => (el.textContent = lang === "en" ? EN[el.dataset.vi] : el.dataset.vi));
  document.querySelectorAll(".lang-btn").forEach((b) => (b.textContent = lang === "en" ? "VI" : "EN"));
  try { localStorage.setItem("lang", lang); } catch {}
}

let saved = null;
try { saved = localStorage.getItem("lang"); } catch {}
setLang(saved || (navigator.language?.startsWith("vi") ? "vi" : "en"));
document.querySelectorAll(".lang-btn").forEach((b) =>
  b.addEventListener("click", () => setLang(document.documentElement.lang === "vi" ? "en" : "vi"))
);

initMotion();

// Màn hình chào mừng (hiện một lần mỗi phiên)
const splash = document.getElementById("splash");
const root = document.documentElement;
let seen = false;
try { seen = sessionStorage.getItem("welcomed") === "1"; } catch {}

function closeSplash() {
  if (!splash || splash.classList.contains("closing")) return;
  splash.classList.add("closing");
  playHero(350);
  root.classList.remove("splash-open");
  try { sessionStorage.setItem("welcomed", "1"); } catch {}
  setTimeout(() => splash.remove(), 1000);
  document.removeEventListener("keydown", onKey);
}
function onKey(e) { if (e.key === "Escape" || e.key === "Enter") closeSplash(); }

if (splash && seen) {
  splash.remove();
  playHero(150);
} else if (!splash) {
  playHero(150);
} else {
  root.classList.add("splash-open");
  document.addEventListener("keydown", onKey);
  document.getElementById("enter").addEventListener("click", closeSplash);
  splash.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const r = document.createElement("span");
    r.className = "click-ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    r.addEventListener("animationend", () => r.remove());
    splash.append(r);
  });
  setTimeout(() => document.getElementById("enter")?.focus({ preventScroll: true }), 1900);
}
