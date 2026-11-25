// Tải ảnh từ nhiều nguồn (Pexels, Unsplash, Pixabay) → dist/images + dist/data/images.json
// Thứ tự thử: biến IMAGE_PROVIDERS (mặc định "pexels,unsplash,pixabay").
// Nguồn nào thiếu API key, bị khóa (401/403/429) hoặc không có kết quả thì tự chuyển sang nguồn kế tiếp.
import { mkdirSync, writeFileSync } from "node:fs";
import { ALL } from "./providers/index.mjs";

const OUT_IMG = "dist/images";
const OUT_JSON = "dist/data/images.json";

const SLOTS = {
  hero:   { q: "Hoan Kiem Lake Hanoi", hero: true },
  legend: { q: "Turtle Tower Hanoi" },
  turtle: { q: "Turtle Tower Hoan Kiem" },
  temple: { q: "Ngoc Son Temple Hanoi" },
  bridge: { q: "The Huc Bridge Hanoi" },
  tower:  { q: "Hanoi lake pagoda sunrise" },
  g1:     { q: "Hanoi old quarter street" },
  g2:     { q: "Hanoi lake sunset" },
  g3:     { q: "Hanoi Vietnam city lake" },
  g4:     { q: "Vietnam temple red bridge" },
  g5:     { q: "Hanoi night lights" },
};

mkdirSync(OUT_IMG, { recursive: true });
mkdirSync("dist/data", { recursive: true });

const order = (process.env.IMAGE_PROVIDERS || "pexels,unsplash,pixabay")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const active = [];
for (const id of order) {
  const p = ALL[id];
  if (!p) { console.warn(`? Nguồn "${id}" không tồn tại, bỏ qua.`); continue; }
  const key = process.env[p.env];
  if (!key) { console.warn(`– ${p.name}: chưa có ${p.env}, bỏ qua.`); continue; }
  active.push({ ...p, key });
}

if (!active.length) {
  console.warn("⚠ Không có nguồn ảnh nào dùng được → trang dùng nền gradient.");
  writeFileSync(OUT_JSON, "{}");
  process.exit(0);
}
console.log("Nguồn ảnh:", active.map((p) => p.name).join(" → "));

const disabled = new Set();
const used = new Set();
const manifest = {};

for (const [slot, { q, hero }] of Object.entries(SLOTS)) {
  let done = false;
  for (const p of active) {
    if (disabled.has(p.id) || done) continue;
    try {
      const results = await p.search(q, p.key);
      const pick = results.find((r) => !used.has(`${p.id}:${r.id}`));
      if (!pick) { console.warn(`– ${slot}: ${p.name} không có kết quả cho "${q}"`); continue; }

      const url = hero ? pick.urls.hero : pick.urls.normal;
      let src = url;
      if (!p.remote) {
        const img = await fetch(url);
        if (!img.ok) throw new Error(`Tải ảnh lỗi ${img.status}`);
        src = `images/${slot}.jpg`;
        writeFileSync(`dist/${src}`, Buffer.from(await img.arrayBuffer()));
      }
      pick.onUse?.();
      used.add(`${p.id}:${pick.id}`);

      manifest[slot] = {
        src,
        alt: pick.alt || q,
        color: pick.color || "#1f4a3f",
        photographer: pick.photographer,
        photographerUrl: pick.photographerUrl,
        pageUrl: pick.pageUrl,
        provider: p.name,
        providerUrl: p.url,
      };
      console.log(`✔ ${slot}: ${p.name} – ${pick.photographer}`);
      done = true;
    } catch (e) {
      console.warn(`✖ ${slot}: ${p.name} – ${e.message}`);
      if (e.fatal) { disabled.add(p.id); console.warn(`  → tạm tắt ${p.name} cho lần build này`); }
    }
  }
  if (!done) console.warn(`✖ ${slot}: không nguồn nào có ảnh`);
}

writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2));
