# Hồ Hoàn Kiếm – trang giới thiệu

Website tĩnh giới thiệu Hồ Gươm, ảnh lấy từ [Pexels](https://www.pexels.com) và tự động deploy bằng GitHub Actions.

## Chạy trên GitHub Actions
1. Tạo repo, đẩy toàn bộ code lên nhánh `main`.
2. Lấy API key miễn phí tại https://www.pexels.com/api/
3. Repo → **Settings → Secrets and variables → Actions → New repository secret**: tên `PEXELS_API_KEY`, dán key.
4. Repo → **Settings → Pages → Source: GitHub Actions**.
5. Push lên `main` (hoặc chạy tay tab **Actions**). Workflow tải ảnh về, build và publish.

## Chạy local
```bash
export PEXELS_API_KEY=your_key   # Windows PowerShell: $env:PEXELS_API_KEY="your_key"
npm run build
npm start
```
Không có key thì trang vẫn chạy, ảnh được thay bằng nền gradient.

## Cấu trúc
- `src/` – HTML, CSS, JS (`js/i18n.js`: bản dịch Anh)
- `scripts/build.mjs` – sao chép `src` → `dist`
- `scripts/fetch-pexels.mjs` – tải ảnh + thông tin tác giả; đổi từ khóa ở object `SLOTS`
- `.github/workflows/deploy.yml` – build và deploy GitHub Pages
