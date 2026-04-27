// src/lib/api/auth.ts
import { apiFetch, tokenStore } from "../api";
import type { ApiSuccess, ApiMessage, AuthResponse, MeResponse, SessionItem } from "#/types";

export interface LoginInput {
	email: string;
	password: string;
}

export interface RegisterStudentInput {
	role: "student";
	email: string;
	password: string;
	fullName: string;
}

export interface RegisterPgOwnerInput {
	role: "pg_owner";
	email: string;
	password: string;
	fullName: string;
	businessName: string;
}

export type RegisterInput = RegisterStudentInput | RegisterPgOwnerInput;

/**
 * Login — returns full AuthResponse including accessToken + refreshToken.
 * apiFetch sends X-Client-Transport: bearer in production so the backend
 * includes them in the JSON body (not just HttpOnly cookies).
 * Tokens are stored in tokenStore so subsequent requests use Bearer auth.
 */
export async function login(data: LoginInput): Promise<AuthResponse> {
	const res = await apiFetch<ApiSuccess<AuthResponse>>("/auth/login", {
		method: "POST",
		body: JSON.stringify(data),
	});
	// Store tokens immediately in production (cross-domain auth)
	if (import.meta.env.PROD && res.data?.accessToken && res.data?.refreshToken) {
		tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
	}
	return res.data;
}

/**
 * Register — same as login, tokens are returned in body and stored.
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
	const res = await apiFetch<ApiSuccess<AuthResponse>>("/auth/register", {
		method: "POST",
		body: JSON.stringify(data),
	});
	if (import.meta.env.PROD && res.data?.accessToken && res.data?.refreshToken) {
		tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
	}
	return res.data;
}

export async function getMe(): Promise<MeResponse> {
	const res = await apiFetch<ApiSuccess<MeResponse>>("/auth/me");
	return res.data;
}

/**
 * Logout — revokes the current session token.
 *
 * The backend POST /auth/logout requires a `refreshToken` in the request body.
 * We always include it regardless of environment:
 *   - In production: token comes from sessionStorage via tokenStore.
 *   - In development: cookies handle auth, but the backend also checks
 *     req.body.refreshToken first, so including it is safe and correct.
 *
 * Failing to send the token causes a 401 from the backend.
 */
export async function logout(): Promise<void> {
	const rt = tokenStore.getRefreshToken();
	await apiFetch<ApiMessage>("/auth/logout", {
		method: "POST",
		body: rt ? JSON.stringify({ refreshToken: rt }) : undefined,
	});
	tokenStore.clearTokens();
}

export async function logoutAll(): Promise<void> {
	await apiFetch<ApiMessage>("/auth/logout/all", { method: "POST" });
	tokenStore.clearTokens();
}

export async function getSessions(): Promise<SessionItem[]> {
	const res = await apiFetch<ApiSuccess<SessionItem[]>>("/auth/sessions");
	return res.data;
}

export async function revokeSession(sid: string): Promise<void> {
	await apiFetch<ApiMessage>(`/auth/sessions/${sid}`, { method: "DELETE" });
}

export async function sendOtp(): Promise<void> {
	await apiFetch<ApiMessage>("/auth/otp/send", { method: "POST" });
}

export async function verifyOtp(otp: string): Promise<void> {
	await apiFetch<ApiMessage>("/auth/otp/verify", {
		method: "POST",
		body: JSON.stringify({ otp }),
	});
}
