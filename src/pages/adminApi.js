const base = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

export async function adminRequest(path, options = {}) {
  const response = await fetch(`${base}/api/${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(response.status === 401 ? 'Please sign in again.' : data?.error?.message || data?.message || 'Unable to complete this request. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
