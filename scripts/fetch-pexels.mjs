// Tải ảnh từ Pexels API vào dist/images và ghi dist/data/images.json
// Cần biến môi trường PEXELS_API_KEY (lấy miễn phí tại https://www.pexels.com/api/)
import { mkdirSync, writeFileSync } from "node:fs";

const KEY = process.env.PEXELS_API_KEY;
const OUT_IMG = "dist/images";
const OUT_JSON = "dist/data/images.json";

// slot → từ khóa tìm kiếm
const SLOTS = {
  hero:   { q: "Hoan Kiem Lake Hanoi", size: "large2x" },
  legend: { q: "Turtle Tower Hanoi", size: "large" },
  turtle: { q: "Turtle Tower Hoan Kiem", size: "large" },
  temple: { q: "Ngoc Son Temple Hanoi", size: "large" },
  bridge: { q: "The Huc Bridge Hanoi", size: "large" },
  tower:  { q: "Hanoi lake pagoda sunrise", size: "large" },
  g1:     { q: "Hanoi old quarter street", size: "large" },
  g2:     { q: "Hanoi lake sunset", size: "large" },
  g3:     { q: "Hanoi Vietnam city lake", size: "large" },
  g4:     { q: "Vietnam temple red bridge", size: "large" },
  g5:     { q: "Hanoi night lights", size: "large" },
};

mkdirSync(OUT_IMG, { recursive: true });
mkdirSync("dist/data", { recursive: true });

if (!KEY) {
  console.warn("⚠ Không có PEXELS_API_KEY → trang dùng nền gradient thay ảnh.");
  writeFileSync(OUT_JSON, "{}");
  process.exit(0);
}

const used = new Set();
const manifest = {};

for (const [slot, { q, size }] of Object.entries(SLOTS)) {
  try {
    const url = `https://api.api.sh/pexels/v1/search?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const { photos = [] } = await res.json();
    const photo = photos.find((p) => !used.has(p.id));
    if (!photo) { console.warn(`– ${slot}: không có kết quả cho "${q}"`); continue; }
    used.add(photo.id);

    const img = await fetch(photo.src[size] || photo.src.large);
    if (!img.ok) throw new Error(`Tải ảnh ${img.status}`);
    const file = `${slot}.jpg`;
    writeFileSync(`${OUT_IMG}/${file}`, Buffer.from(await img.arrayBuffer()));

    manifest[slot] = {
      src: `images/${file}`,
      alt: photo.alt || q,
      color: photo.avg_color || "#1f4a3f",
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pexelsUrl: photo.url,
    };
    console.log(`✔ ${slot}: ${photo.photographer}`);
  } catch (e) {
    console.warn(`✖ ${slot}: ${e.message}`);
  }
}

writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2));
