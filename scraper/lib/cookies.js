/**
 * Normalizes Cookie-Editor export format to Playwright's expected format.
 *
 * Cookie-Editor exports:  { expirationDate, sameSite: 'lax', hostOnly, session, storeId, ... }
 * Playwright expects:     { expires, sameSite: 'Lax', name, value, domain, path, httpOnly, secure }
 */

function normalizeSameSite(value) {
  if (!value) return 'Lax'
  const v = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  return ['Strict', 'Lax', 'None'].includes(v) ? v : 'Lax'
}

export function normalizeCookies(raw) {
  return raw.map((c) => ({
    name:     c.name,
    value:    c.value,
    domain:   c.domain,
    path:     c.path || '/',
    expires:  c.expirationDate ? Math.floor(c.expirationDate) : (c.expires ?? -1),
    httpOnly: c.httpOnly ?? false,
    secure:   c.secure ?? false,
    sameSite: normalizeSameSite(c.sameSite),
  }))
}

export function parseCookieEnv(envVar) {
  if (!envVar) return null
  try {
    return normalizeCookies(JSON.parse(envVar))
  } catch {
    return null
  }
}
