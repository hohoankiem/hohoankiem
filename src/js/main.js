import { EN } from "./i18n.js";
// Nạp ảnh Pexels từ data/images.json (do scripts/fetch-pexels.mjs tạo ra)
const credits = new Map();

async function loadManifest() {
  try {
    const res = await fetch("data/images.json");
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

function applyImages(manifest) {
  document.querySelectorAll("[data-img]").forEach((el) => {
    const item = manifest[el.dataset.img];
    if (!item) return;
    el.style.backgroundColor = item.color;
    el.style.backgroundImage = `url("${item.src}")`;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", item.alt);
    el.dataset.full = item.src;
    credits.set(item.photographer, item.photographerUrl);
  });

  document.querySelectorAll("[data-credit]").forEach((cap) => {
    const item = manifest[cap.dataset.credit];
    if (!item) return;
    const a = `<a href="${item.pexelsUrl}" target="_blank" rel="noopener">${item.photographer}</a>`;
    cap.innerHTML = `<span class="vi">Ảnh: ${a} / Pexels</span><span class="en">Photo: ${a} / Pexels</span>`;
  });

  const list = document.getElementById("credits");
  credits.forEach((url, name) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${name}</a>`;
    list.append(li);
  });
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

// Màn hình chào mừng (hiện một lần mỗi phiên)
const splash = document.getElementById("splash");
const root = document.documentElement;
let seen = false;
try { seen = sessionStorage.getItem("welcomed") === "1"; } catch {}

function closeSplash() {
  if (!splash || splash.classList.contains("closing")) return;
  splash.classList.add("closing");
  root.classList.remove("splash-open");
  try { sessionStorage.setItem("welcomed", "1"); } catch {}
  setTimeout(() => splash.remove(), 1000);
  document.removeEventListener("keydown", onKey);
}
function onKey(e) { if (e.key === "Escape" || e.key === "Enter") closeSplash(); }

if (splash && seen) {
  splash.remove();
} else if (splash) {
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
