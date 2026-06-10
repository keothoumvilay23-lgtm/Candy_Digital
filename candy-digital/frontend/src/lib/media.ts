/**
 * Chuyển đường dẫn ảnh lưu trong DB thành URL tải được: giữ nguyên URL tuyệt đối (CDN),
 * ghép API base cho đường dẫn tương đối như /uploads/...
 */
export function resolveMediaUrl(
  path: string | null | undefined,
  apiBase?: string | null
): string {
  if (path == null || path === '') return '';
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (apiBase ?? '').replace(/\/$/, '');
  const rel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return base ? `${base}${rel}` : rel;
}
