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
// In development (same-origin localhost), we rely on HttpOnly cookies set by
// the backend — credentials: "include" + sameSite: "strict" works fine because
// both frontend and backend share the same host (localhost).
//
// In production, the frontend (roomies-lilac.vercel.app) and backend
// (roomies-api.onrender.com) are on DIFFERENT domains. Browsers enforce:
//   1. sameSite: "strict" cookies are NEVER sent cross-site → auth breaks
//   2. Even sameSite: "lax" won't work for POST/PUT/DELETE cross-site requests
//   3. credentials: "include" requires the server to echo the exact Origin in
//      Access-Control-Allow-Origin (not *) — and Render sets it correctly
//      but the cookies still don't cross domain boundaries reliably
//
// The fix: in production, use the X-Client-Transport: bearer header to signal
// the backend to return tokens in the JSON response body (not cookies), then
// store them in memory (not localStorage — XSS risk) and send them as
// Authorization: Bearer headers on every request.
//
// The backend already supports this pattern — see auth.controller.js:
//   const isBearerTransport = (req) =>
//     req.headers["x-client-transport"] === "bearer";
// When this header is present, the backend includes accessToken + refreshToken
// in the response body AND still sets the cookies (belt + suspenders).

const IS_PROD = import.meta.env.PROD;

// In-memory token store (lost on page refresh — handled by hydration below)
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

// Session storage keys (survives page refresh within the same tab, not XSS-
// accessible from other origins, cleared when the tab closes)
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
let _refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
	// Deduplicate concurrent refresh attempts
	if (_refreshPromise) return _refreshPromise;

	_refreshPromise = (async () => {
		const rt = tokenStore.getRefreshToken();
		if (!rt) return false;

		try {
			const res = await fetch(`${BASE}/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Client-Transport": "bearer",
				},
				// In prod: send token in body. In dev: rely on cookie.
				body: IS_PROD ? JSON.stringify({ refreshToken: rt }) : undefined,
				credentials: IS_PROD ? "omit" : "include",
			});

			if (!res.ok) {
				tokenStore.clearTokens();
				return false;
			}

			const json = await res.json();
			const data = json?.data;
			if (data?.accessToken && data?.refreshToken) {
				tokenStore.setTokens(data.accessToken, data.refreshToken);
				return true;
			}
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
		// Tell backend to return tokens in body, not just cookies
		headers["X-Client-Transport"] = "bearer";

		const at = tokenStore.getAccessToken();
		if (at) {
			headers["Authorization"] = `Bearer ${at}`;
		}
	}

	const fetchOptions: RequestInit = {
		...options,
		headers,
		// In dev: send cookies for same-origin localhost. In prod: omit — we use Bearer.
		credentials: IS_PROD ? "omit" : "include",
	};

	let res = await fetch(`${BASE}${path}`, fetchOptions);

	// If 401 in prod, try a silent token refresh then retry once
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
