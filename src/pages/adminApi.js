const base = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

export function getAttachmentDownloadUrl(audience, reference, id) {
  return `${base}/api/${audience}/inquiries/${encodeURIComponent(reference)}/attachments/${encodeURIComponent(id)}/download`;
}

export async function adminRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${base}/api/${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(response.status === 401 ? 'Please sign in again.' : data?.error?.message || data?.message || 'Unable to complete this request. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
