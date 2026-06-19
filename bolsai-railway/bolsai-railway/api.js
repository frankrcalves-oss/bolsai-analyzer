// api.js — usa proxy relativo (funciona local e na nuvem)
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }
  return res.json();
}

const API = {
  quote:        (ticker)        => apiFetch(`/api/v1/stocks/${ticker}/quote`),
  history:      (ticker, limit) => apiFetch(`/api/v1/stocks/${ticker}/history?limit=${limit}`),
  fundamentals: (ticker)        => apiFetch(`/api/v1/fundamentals/${ticker}`),
  dividends:    (ticker)        => apiFetch(`/api/v1/stocks/${ticker}/dividends?limit=20`),
  tickers:      ()              => apiFetch(`/api/v1/stocks/tickers`),
  usage:        ()              => apiFetch(`/api/v1/auth/me`),
  macro:        (series)        => apiFetch(`/api/v1/macro/${series}?limit=24`),
};
