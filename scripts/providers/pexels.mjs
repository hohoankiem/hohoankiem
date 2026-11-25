import { getJson } from "./util.mjs";

export default {
  id: "pexels",
  name: "Pexels",
  url: "https://www.pexels.com",
  env: "PEXELS_API_KEY",
  remote: false, // tải ảnh về dist/images
  async search(q, key) {
    const data = await getJson(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape`,
      { Authorization: key }
    );
    return (data.photos || []).map((p) => ({
      id: p.id,
      urls: { hero: p.src.large2x, normal: p.src.large },
      alt: p.alt,
      color: p.avg_color,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      pageUrl: p.url,
    }));
  },
};
