# Auth Bug Fix Summary

## Root Cause

Frontend (roomies-lilac.vercel.app) and backend (roomies-api.onrender.com) are on **different domains**. The original
code was built assuming same-origin (localhost), where cookies flow freely. Cross-domain has strict browser rules that
silently break auth.

---

## Bugs Found & Fixed

### Bug 1 — `sameSite: "strict"` on cookies (CRITICAL)

**File:** `src/middleware/authenticate.js`

```
// BEFORE (broken cross-domain)
sameSite: "strict"   // Browser NEVER sends this cookie cross-site. Ever.

// AFTER
sameSite: IS_PROD ? "none" : "lax"
secure:   IS_PROD ? true  : false
```

`sameSite: "strict"` means the browser drops the cookie on every single API call from a different domain. The user
appears logged out immediately even though login "worked". This is the primary bug.

`sameSite: "none"` requires `secure: true` (HTTPS). Render uses HTTPS so this is fine.

---

### Bug 2 — Frontend never stored or sent tokens in production (CRITICAL)

**File:** `src/lib/api.ts`

```
// BEFORE (broken)
credentials: "include"   // Browser tries to send cookies → blocked cross-domain

// AFTER
// In production: use Authorization: Bearer <token> header instead
// In development: keep credentials: "include" (cookies work on localhost)
```

The frontend was using `credentials: "include"` hoping cookies would flow cross-domain. They don't. The fix switches to
the **bearer token transport** in production:

1. Frontend sends `X-Client-Transport: bearer` header
2. Backend (already implemented in auth.controller.js) returns tokens in JSON body
3. Frontend stores them in `sessionStorage` via `tokenStore`
4. Every subsequent request sends `Authorization: Bearer <token>`

The backend already had all the bearer transport code — it just wasn't being used.

---

### Bug 3 — `AuthResponse` type missing `accessToken`/`refreshToken` (CRITICAL)

**File:** `src/context/AuthContext.tsx`

The `login()` function in AuthContext received `AuthResponse` but never extracted or stored the tokens from it. In
production you need to call `tokenStore.setTokens()` immediately when login/register returns.

```typescript
// BEFORE — tokens ignored
const login = useCallback((data: AuthResponse) => {
	setUser({ ...data.user, sid: data.sid }); // tokens lost!
}, []);

// AFTER — tokens stored
const login = useCallback((data: AuthResponse) => {
	if (import.meta.env.PROD && data.accessToken && data.refreshToken) {
		tokenStore.setTokens(data.accessToken, data.refreshToken);
	}
	setUser({ ...data.user, sid: data.sid });
}, []);
```

---

### Bug 4 — CORS `credentials: true` was missing (CRITICAL)

**File:** `src/app.js`

```javascript
// BEFORE — broken
cors({ origin: config.ALLOWED_ORIGINS, credentials: true });
// was using the array directly as origin, which doesn't work for dynamic matching

// AFTER — correct
cors({
	origin: (origin, callback) => {
		/* check allowlist */
	},
	credentials: true, // Required for cookies AND for browser to read response body
});
```

Without `credentials: true` on the server, the browser blocks reading the response body even if the request succeeds.
The `Access-Control-Allow-Credentials: true` header must be present.

---

### Bug 5 — auth.controller.js used hardcoded cookie options (MINOR)

**File:** `src/controllers/auth.controller.js`

The controller defined its own `ACCESS_COOKIE_OPTIONS` independent of `authenticate.js`, so they could drift out of
sync. Now both import from a single source.

Also: `register`, `login`, `refresh`, and `googleCallback` now **always** return the full token data (not just
`buildSafeBody`) so the frontend can extract tokens in production regardless of whether `X-Client-Transport: bearer` is
detected.

---

### Bug 6 — Hydration skips network call when no tokens exist (MINOR)

**File:** `src/context/AuthContext.tsx`

In production, if `sessionStorage` has no tokens, calling `GET /auth/me` will always return 401. The fix short-circuits
immediately instead of making a pointless 401 call.

---

### Bug 7 — `ALLOWED_ORIGINS` had trailing slash in env var (MINOR)

**Backend env var (Render dashboard):**

```
# BEFORE
ALLOWED_ORIGINS=https://roomies-lilac.vercel.app/   ← trailing slash

# AFTER
ALLOWED_ORIGINS=https://roomies-lilac.vercel.app    ← no trailing slash
```

Browser sends `Origin: https://roomies-lilac.vercel.app` (no trailing slash). If the allowlist has a trailing slash, the
comparison fails → CORS blocked.

---

## Files to Update

### Backend (src/)

1. `src/middleware/authenticate.js` → use new file
2. `src/controllers/auth.controller.js` → use new file
3. `src/app.js` → use new file

### Frontend (src/)

4. `src/lib/api.ts` → use new file
5. `src/context/AuthContext.tsx` → use new file
6. `src/lib/api/auth.ts` → use new file

### Render Dashboard

7. Fix `ALLOWED_ORIGINS` → remove trailing slash

---

## How the Auth Flow Works After Fix

### Production (cross-domain)

```
1. User submits login form
2. Frontend: POST /auth/login  (with X-Client-Transport: bearer header)
3. Backend: validates, creates session, sets sameSite:none cookies AND returns tokens in body
4. Frontend: reads tokens from response.data, stores in sessionStorage
5. Subsequent requests: sends Authorization: Bearer <access_token>
6. When token expires (15m): apiFetch gets 401, calls silentRefresh with stored refresh token
7. silentRefresh: POST /auth/refresh { refreshToken } → gets new tokens → stores them
8. Retries original request with new access token
```

### Development (same-origin localhost)

```
1. Everything unchanged — cookies flow normally on localhost
2. No X-Client-Transport header sent
3. Backend sets lax cookies, frontend relies on cookies
```
