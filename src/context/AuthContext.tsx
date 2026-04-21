// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MeResponse, AuthResponse, Role } from "#/types";
import { getMe, logout as apiLogout } from "#/lib/api/auth";
import { tokenStore } from "#/lib/api";

interface AuthContextValue {
	user: MeResponse | null;
	isLoading: boolean;
	role: Role | null;
	isEmailVerified: boolean;
	login: (data: AuthResponse) => void;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<MeResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const role = user?.roles?.[0] as Role | null;
	const isEmailVerified = user?.isEmailVerified ?? false;

	const refreshUser = useCallback(async () => {
		try {
			const me = await getMe();
			setUser(me);
		} catch {
			setUser(null);
		}
	}, []);

	useEffect(() => {
		async function hydrate() {
			// In production (cross-domain), tokens live in sessionStorage via tokenStore.
			// If there are no tokens at all, skip the network call — user is not logged in.
			if (import.meta.env.PROD && !tokenStore.hasTokens()) {
				setIsLoading(false);
				return;
			}

			try {
				const me = await getMe();
				setUser(me);
			} catch {
				// Token expired or invalid. apiFetch will attempt silent refresh first.
				// If that also fails it clears the token store, so we just set user to null.
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}
		hydrate();
	}, []);

	/**
	 * Called after successful login / register / googleCallback.
	 *
	 * The backend ALWAYS includes accessToken + refreshToken in the response body
	 * (auth.controller.js always returns the full `tokens` object, not just buildSafeBody).
	 * In production we extract them here and store via tokenStore for subsequent requests.
	 * In development, HttpOnly cookies on localhost handle everything — we just set user state.
	 */
	const login = useCallback((data: AuthResponse) => {
		if (import.meta.env.PROD) {
			if (data.accessToken && data.refreshToken) {
				tokenStore.setTokens(data.accessToken, data.refreshToken);
			} else {
				// This should never happen if the backend is correct, but guard defensively.
				console.warn("[AuthContext] login() called without tokens in production — auth may not persist");
			}
		}
		setUser({ ...data.user, sid: data.sid });
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
			// Always clear local state even if the API call fails
			tokenStore.clearTokens();
			setUser(null);
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				role,
				isEmailVerified,
				login,
				logout,
				refreshUser,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}
