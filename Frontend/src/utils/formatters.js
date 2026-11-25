/**
 * Returns local calendar date in YYYY-MM-DD format without UTC shift.
 */
export function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDisplayDate(value) {
  if (!value) return '—';
  const str = String(value);
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let dateObj;

  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    dateObj = new Date(str);
  }

  if (Number.isNaN(dateObj.getTime())) return str;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(timeStr);

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return '—';
  if (!endTime) return formatTime(startTime);
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function truncateId(id, start = 8, end = 4) {
  if (!id) return '—';
  const str = String(id);
  if (str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}…${str.slice(-end)}`;
}

export function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null || Number.isNaN(Number(bytes))) return '—';
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDistanceScore(distance) {
  if (distance === undefined || distance === null || Number.isNaN(Number(distance))) return '—';
  const similarity = Math.max(0, Math.min(1, 1 - Number(distance)));
  return `${Math.round(similarity * 100)}% match`;
}

