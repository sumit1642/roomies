// src/lib/api.ts
import type { ApiError } from "#/types";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export class ApiClientError extends Error {
	constructor(
		public status: number,
		public body: ApiError,
	) {
		super(body.message);
		this.name = "ApiClientError";
	}
}

// ─── Token storage ────────────────────────────────────────────────────────────
//
// Production auth strategy (cross-domain: Vercel frontend + Render backend):
//
// Problem: Browsers block cross-domain cookies with sameSite restrictions.
//   sameSite:"strict" → NEVER sent cross-site (our old default, completely broken)
//   sameSite:"lax"    → only sent on top-level GET navigations (still broken for API calls)
//   sameSite:"none"   → works cross-site BUT requires secure:true AND the browser
//                       still blocks them in many scenarios (Render free tier, etc.)
//
// Solution: X-Client-Transport: bearer header approach
//   1. Frontend sends "X-Client-Transport: bearer" header on every request
//   2. Backend detects this and returns { accessToken, refreshToken } IN THE JSON BODY
//      (in addition to setting cookies as a fallback)
//   3. Frontend stores tokens in sessionStorage (survives page refresh, not XSS-accessible
//      from other origins, cleared when tab closes)
//   4. Every subsequent request uses Authorization: Bearer <accessToken>
//   5. When 401 received, try silent refresh with the stored refreshToken
//
// Development (localhost, same-origin): cookies work fine, skip all this.

const IS_PROD = import.meta.env.PROD;

// In-memory cache (fastest path — avoids sessionStorage reads on every request)
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

const ACCESS_KEY = "roomies_at";
const REFRESH_KEY = "roomies_rt";

export const tokenStore = {
	setTokens(access: string, refresh: string) {
		_accessToken = access;
		_refreshToken = refresh;
		if (IS_PROD) {
			try {
				sessionStorage.setItem(ACCESS_KEY, access);
				sessionStorage.setItem(REFRESH_KEY, refresh);
			} catch {
				// sessionStorage blocked (private browsing edge case) — in-memory only
			}
		}
	},

	getAccessToken(): string | null {
		if (_accessToken) return _accessToken;
		if (IS_PROD) {
			try {
				_accessToken = sessionStorage.getItem(ACCESS_KEY);
			} catch {
				// ignore
			}
		}
		return _accessToken;
	},

	getRefreshToken(): string | null {
		if (_refreshToken) return _refreshToken;
		if (IS_PROD) {
			try {
				_refreshToken = sessionStorage.getItem(REFRESH_KEY);
			} catch {
				// ignore
			}
		}
		return _refreshToken;
	},

	clearTokens() {
		_accessToken = null;
		_refreshToken = null;
		if (IS_PROD) {
			try {
				sessionStorage.removeItem(ACCESS_KEY);
				sessionStorage.removeItem(REFRESH_KEY);
			} catch {
				// ignore
			}
		}
	},

	hasTokens(): boolean {
		return Boolean(this.getAccessToken());
	},
};

// ─── Silent refresh ────────────────────────────────────────────────────────────
// Deduplicate concurrent refresh attempts — if two requests 401 simultaneously,
// only one refresh call is made and both requests wait for it.
let _refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
	if (_refreshPromise) return _refreshPromise;

	_refreshPromise = (async () => {
		const rt = tokenStore.getRefreshToken();
		if (!rt) return false;

		try {
			const res = await fetch(`${BASE}/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					// Signal backend to return tokens in body
					"X-Client-Transport": "bearer",
				},
				body: JSON.stringify({ refreshToken: rt }),
				credentials: "omit", // No cookies in prod cross-domain
			});

			if (!res.ok) {
				tokenStore.clearTokens();
				return false;
			}

			const json = await res.json();
			const data = json?.data as { accessToken?: string; refreshToken?: string } | undefined;
			if (data?.accessToken && data?.refreshToken) {
				tokenStore.setTokens(data.accessToken, data.refreshToken);
				return true;
			}
			tokenStore.clearTokens();
			return false;
		} catch {
			return false;
		} finally {
			_refreshPromise = null;
		}
	})();

	return _refreshPromise;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options?.headers as Record<string, string>),
	};

	if (IS_PROD) {
		// Tell backend to return tokens in JSON body (bearer transport mode)
		headers["X-Client-Transport"] = "bearer";

		const at = tokenStore.getAccessToken();
		if (at) {
			headers["Authorization"] = `Bearer ${at}`;
		}
	}

	const fetchOptions: RequestInit = {
		...options,
		headers,
		// Dev: include cookies (same-origin localhost works fine)
		// Prod: omit — we use Authorization header instead of cross-domain cookies
		credentials: IS_PROD ? "omit" : "include",
	};

	let res = await fetch(`${BASE}${path}`, fetchOptions);

	// On 401 in production, try silent token refresh then retry once
	if (res.status === 401 && IS_PROD) {
		const refreshed = await silentRefresh();
		if (refreshed) {
			const newAt = tokenStore.getAccessToken();
			if (newAt) headers["Authorization"] = `Bearer ${newAt}`;
			res = await fetch(`${BASE}${path}`, { ...fetchOptions, headers });
		}
	}

	if (!res.ok) {
		let body: ApiError;
		try {
			body = await res.json();
		} catch {
			body = { status: "error", message: `HTTP ${res.status}` };
		}
		throw new ApiClientError(res.status, body);
	}

	return res.json() as Promise<T>;
}
