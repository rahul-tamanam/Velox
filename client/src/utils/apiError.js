/**
 * Turn axios / fetch errors into a safe string for React (never render raw objects).
 */
export function formatApiError(err, fallback = 'Something went wrong') {
  if (err == null) return fallback;
  const msg = typeof err.message === 'string' ? err.message : '';
  const data = err.response?.data;
  if (data == null) return msg || fallback;
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error.message === 'string') return data.error.message;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.code === 'string' && typeof data.message === 'string') {
    return `${data.code}: ${data.message}`;
  }
  try {
    return msg || JSON.stringify(data);
  } catch {
    return msg || fallback;
  }
}
