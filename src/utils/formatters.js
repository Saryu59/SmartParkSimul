/**
 * General string, status, and number formatters
 */

export function formatPercentage(value, total) {
  if (!total || total === 0) return '0%';
  const pct = Math.round((value / total) * 100);
  return `${pct}%`;
}

export function generateReservationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SP-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function truncateText(text, maxLen = 30) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
}
