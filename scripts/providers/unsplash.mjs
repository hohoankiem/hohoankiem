import { getJson } from "./util.mjs";

const UTM = "utm_source=ho_hoan_kiem&utm_medium=referral";
const withUtm = (u) => (u.includes("?") ? `${u}&${UTM}` : `${u}?${UTM}`);

export default {
  id: "unsplash",
  name: "Unsplash",
  url: withUtm("https://unsplash.com/"),
  env: "UNSPLASH_ACCESS_KEY",
  remote: true, // Unsplash yêu cầu hotlink ảnh từ CDN của họ
  async search(q, key) {
    const auth = { Authorization: `Client-ID ${key}` };
    const data = await getJson(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape`,
      auth
    );
    return (data.results || []).map((p) => ({
      id: p.id,
      urls: {
        hero: `${p.urls.raw}&w=2000&q=80&fm=jpg&fit=max`,
        normal: `${p.urls.raw}&w=1200&q=80&fm=jpg&fit=max`,
      },
      alt: p.alt_description || p.description,
      color: p.color,
      photographer: p.user.name,
      photographerUrl: withUtm(p.user.links.html),
      pageUrl: withUtm(p.links.html),
      // theo hướng dẫn API: báo cho Unsplash biết ảnh được dùng
      onUse: () => fetch(p.links.download_location, { headers: auth }).catch(() => {}),
    }));
  },
};
