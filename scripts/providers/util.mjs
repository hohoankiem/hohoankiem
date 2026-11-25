export class ProviderError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.status = status;
    // key bị khóa / sai / hết lượt → tạm bỏ qua nhà cung cấp này cho lần build hiện tại
    this.fatal = [401, 403, 429].includes(status);
  }
}

export async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new ProviderError(res.status);
  return res.json();
}
