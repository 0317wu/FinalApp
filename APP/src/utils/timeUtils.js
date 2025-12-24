// src/utils/timeUtils.js
function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

// ✅ 給 History 分組：今天 / 昨天 / 更早
export function formatDateLabel(isoString) {
  if (!isoString) return '更早';
  const d = new Date(isoString);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = startOfToday.getTime() - startOfThatDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  return '更早';
}

// ✅ 給 Analytics：時段統計
export function getTimeOfDayBucket(isoString) {
  if (!isoString) return '其他';
  const h = new Date(isoString).getHours();
  if (h >= 6 && h < 12) return '早上';
  if (h >= 12 && h < 18) return '下午';
  if (h >= 18 && h < 24) return '晚上';
  return '深夜';
}
