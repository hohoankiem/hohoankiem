# Hồ Hoàn Kiếm – trang giới thiệu (song ngữ Việt / Anh)

Website tĩnh giới thiệu Hồ Gươm, có màn hình chào mừng, bản đồ, và ảnh lấy tự động từ **Pexels, Unsplash, Pixabay**. Deploy bằng GitHub Actions lên GitHub Pages.

## Nguồn ảnh
Script `scripts/fetch-images.mjs` thử lần lượt các nguồn theo thứ tự (mặc định `pexels,unsplash,pixabay`). Nguồn nào thiếu key, bị khóa (401/403/429) hoặc không có kết quả thì tự chuyển sang nguồn kế tiếp. Không có nguồn nào dùng được thì trang dùng nền gradient.

| Nguồn | Secret cần tạo | Lấy key |
|---|---|---|
| Pexels | `PEXELS_API_KEY` | https://www.pexels.com/api/ |
| Unsplash | `UNSPLASH_ACCESS_KEY` | https://unsplash.com/developers |
| Pixabay | `PIXABAY_API_KEY` | https://pixabay.com/api/docs/ |

- Pexels và Pixabay: ảnh được tải về `dist/images`.
- Unsplash: theo quy định API, ảnh được hotlink từ CDN Unsplash và có gọi endpoint download.
- Tên tác giả và nguồn ảnh được hiện ở chú thích ảnh và chân trang.

Đổi thứ tự hoặc chỉ dùng một số nguồn: Settings → Secrets and variables → Actions → tab **Variables** → tạo `IMAGE_PROVIDERS`, ví dụ `unsplash,pixabay,pexels`.

Thêm nguồn mới: tạo `scripts/providers/<ten>.mjs` giống `pexels.mjs`, khai báo trong `scripts/providers/index.mjs`.

## Chạy trên GitHub Actions
1. Đẩy code lên nhánh `main`.
2. Tạo các secret ở bảng trên (chỉ cần ít nhất một).
3. Settings → Pages → Source: **GitHub Actions**.
4. Push hoặc chạy tay workflow ở tab Actions.

## Chạy local
```bash
export UNSPLASH_ACCESS_KEY=...   # và/hoặc PEXELS_API_KEY, PIXABAY_API_KEY
npm run build
npm start
```

## Cấu trúc
- `src/` – HTML, CSS, JS (`js/i18n.js`: bản dịch Anh; `js/motion.js`: animation cuộn trang và chuyển động)
- `scripts/build.mjs` – sao chép `src` → `dist`
- `scripts/fetch-images.mjs` + `scripts/providers/` – tải ảnh; từ khóa ở object `SLOTS`
- `.github/workflows/deploy.yml` – build và deploy
