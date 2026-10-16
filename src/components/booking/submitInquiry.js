export async function submitInquiry(payload, key, apiUrl = import.meta.env?.VITE_API_URL || '') {
  let response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error('We could not confirm your submission. Your details are still here; please retry.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error?.message || 'The booking service is unavailable. Please try again shortly.');
    error.code = result?.error?.code;
    error.fields = result?.error?.fields || {};
    error.reference = result?.error?.reference;
    throw error;
  }
  if (!result?.inquiry?.reference) throw new Error('We could not confirm your submission. Please retry with the same details.');
  return result.inquiry;
}
