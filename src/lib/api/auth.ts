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

export async function login(data: LoginInput): Promise<AuthResponse> {
	const res = await apiFetch<ApiSuccess<AuthResponse>>("/auth/login", {
		method: "POST",
		body: JSON.stringify(data),
	});
	if (import.meta.env.PROD && res.data?.accessToken && res.data?.refreshToken) {
		tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
	}
	return res.data;
}

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

export async function logout(): Promise<void> {
	const rt = tokenStore.getRefreshToken();
	await apiFetch<ApiMessage>("/auth/logout", {
		method: "POST",
		body: JSON.stringify({ refreshToken: rt ?? "" }),
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

/**
 * POST /auth/google/callback
 * Exchange a Google ID token for a Roomies session.
 * The `idToken` is the credential returned by Google Sign-In.
 */
export async function googleCallback(idToken: string): Promise<AuthResponse> {
	const res = await apiFetch<ApiSuccess<AuthResponse>>("/auth/google/callback", {
		method: "POST",
		body: JSON.stringify({ idToken }),
	});
	if (import.meta.env.PROD && res.data?.accessToken && res.data?.refreshToken) {
		tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
	}
	return res.data;
}
