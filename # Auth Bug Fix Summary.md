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
-----------------
# Fix 2
# Bug Fix Notes — Auth + Types + Production Deployment

## Files Changed

### 1. `src/types/api.ts` — REPLACE ENTIRELY
**Fixes:**
- Added `accessToken: string` and `refreshToken: string` to `AuthResponse` interface (they ARE returned by the backend in the JSON body)
- Fixed `PropertyListItem` — removed incorrect legacy fields (`id`, `name`, `address`, etc.), now matches actual backend response
- Fixed `ListingDetail.property` type — backend returns camelCase embedded object (`propertyName`, `propertyType`, `addressLine`, `averageRating`, `ratingCount`, `houseRules`) not snake_case — now typed as `ListingPropertySummary`
- Fixed `SavedListingItem` — backend returns `rentPerMonth`/`depositAmount` as camelCase (after `toRupees()` transform) but other fields as snake_case
- Added `SubmitRatingResponse` type (backend returns `{ ratingId, createdAt }`, not the full rating object)
- Added `LegacyProperty` as a named export (was inline only)
- Removed all the junk legacy fields (`id`, `name`, `address`, `rating`, `rating_count`, etc.) from `Property` — these don't exist in the backend response

### 2. `src/types/enums.ts` — REPLACE ENTIRELY
**Fixes:**
- Added `VERIFICATION_PENDING: "verification_pending"` to `NotificationType` (added in migration 002 but missing from frontend)
- Cleaned up `ListingStatus` type — was broken with duplicate `"deactivated"` in union

### 3. `src/context/AuthContext.tsx` — REPLACE ENTIRELY
**Fixes:**
- `login()` now correctly calls `tokenStore.setTokens(data.accessToken, data.refreshToken)` — `accessToken` and `refreshToken` are now properly typed on `AuthResponse` so no more TypeScript error
- Added defensive warning log if tokens are missing in production

### 4. `src/lib/api/auth.ts` — REPLACE ENTIRELY
**Fixes:**
- `login()` and `register()` now correctly reference `res.data.accessToken` and `res.data.refreshToken` — no TypeScript error
- `logout()` sends refresh token in body for production cross-domain

### 5. `src/lib/api.ts` — REPLACE ENTIRELY
**Fixes:**
- Better inline documentation
- Silent refresh now clears tokens on failure
- No functional changes, just cleaner code

### 6. `src/routes/_auth/_pgowner/listings.tsx` — REPLACE ENTIRELY
**Fixes:**
- Removed unused `Edit` import
- Removed unused `l` variable (unused filter function)
- Removed unused `getPropertyName` function
- Removed unused `selectedPropertyFilter` state (was set but never used in filter logic since `listingId` search doesn't support property_id filtering)

### 7. `src/routes/_auth/listing.$id.tsx` — REPLACE ENTIRELY
**Fixes:**
- `listing.property` field access now uses correct camelCase field names: `property.propertyName`, `property.addressLine`, `property.averageRating`, `property.ratingCount`, `property.houseRules` (backend returns camelCase object via `fetchListingDetail`)
- Added address line display
- Added pincode display
- Added preferences display
- Added bed type display
- Added "no owner name" fallback: `listing.poster_name || "Property Owner"`
- Filtered out `processing:` placeholder photos from gallery
- Added deposit amount display next to rent in header

### 8. `src/lib/api/properties.ts` — REPLACE
**Fixes:**
- Removed inline `LegacyProperty` type definition (now imported from types)
- Cleaner imports

### 9. `src/lib/api/ratings.ts` — REPLACE ENTIRELY
**Fixes:**
- `submitRating()` now returns `SubmitRatingResponse` (`{ ratingId, createdAt }`) matching backend
- Added separate `getPublicUserRatings()` and `getPublicPropertyRatings()` functions (backend has separate endpoints)
- Added `getMyGivenRatings()` function
- `ratingsApi.createRating()` now requires proper `connectionId` and `revieweeType` (not a fake UUID)

### 10. `src/lib/api/connections.ts` — REPLACE
**Fixes:**
- `confirmConnection()` returns the correct response shape from the backend

---

## Why Owner Names Were Not Showing

The `listing.property` object in `ListingDetail` was typed with snake_case fields like `property_name`, `address_line`, `average_rating` — but the backend's `fetchListingDetail` function builds the embedded property object with **camelCase keys** via `JSONB_BUILD_OBJECT('propertyName', p.property_name, 'addressLine', p.address_line, ...)`.

So `listing.property.property_name` was always `undefined` — the actual value was at `listing.property.propertyName`.

## Why Tokens Were Lost in Production

1. `AuthResponse` type was missing `accessToken`/`refreshToken` fields → TypeScript prevented accessing them → tokens were never stored
2. Even if TypeScript was ignored, `AuthContext.login()` was never calling `tokenStore.setTokens()` with the actual token values

## Deployed Environment Notes

Your Render deploy vars look correct. The key ones for cross-domain auth:
- `TRUST_PROXY=1` ✓ (needed for Render's proxy layer)  
- `ALLOWED_ORIGINS=https://roomies-lilac.vercel.app` ✓ (no trailing slash — correct)
- `NODE_ENV=production` ✓ (enables sameSite:none cookies as fallback)

The backend `authenticate.js` already sets `sameSite: IS_PROD ? "none" : "lax"` and `secure: IS_PROD`. So cookies work correctly in production too. The bearer token transport is a belt-and-suspenders approach that makes auth work even when cookies are blocked by browser privacy settings.