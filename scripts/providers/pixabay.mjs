import { getJson } from "./util.mjs";

export default {
  id: "pixabay",
  name: "Pixabay",
  url: "https://pixabay.com",
  env: "PIXABAY_API_KEY",
  remote: false, // Pixabay cấm hotlink → tải ảnh về
  async search(q, key) {
    const data = await getJson(
      `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}` +
        `&image_type=photo&orientation=horizontal&per_page=20&safesearch=true`
    );
    return (data.hits || []).map((p) => ({
      id: p.id,
      urls: { hero: p.largeImageURL, normal: p.largeImageURL },
      alt: p.tags,
      color: "#1f4a3f",
      photographer: p.user,
      photographerUrl: `https://pixabay.com/users/${p.user}-${p.user_id}/`,
      pageUrl: p.pageURL,
    }));
  },
};
