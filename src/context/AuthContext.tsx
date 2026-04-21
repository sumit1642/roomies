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
			// In production, tokens are stored in sessionStorage (via tokenStore).
			// We need tokens present before calling /auth/me — if there are none,
			// the user is logged out (skip the network call entirely).
			if (import.meta.env.PROD && !tokenStore.hasTokens()) {
				setIsLoading(false);
				return;
			}

			try {
				const me = await getMe();
				setUser(me);
			} catch {
				// Token may be expired — tokenStore.clearTokens() is called by
				// apiFetch's 401 handler when silent refresh also fails.
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}
		hydrate();
	}, []);

	// login() is called after register/login/googleCallback with the full
	// AuthResponse (which includes accessToken + refreshToken in prod because
	// we send X-Client-Transport: bearer).
	const login = useCallback((data: AuthResponse) => {
		// Store tokens if present (prod). In dev, cookies handle this.
		if (import.meta.env.PROD && data.accessToken && data.refreshToken) {
			tokenStore.setTokens(data.accessToken, data.refreshToken);
		}
		setUser({ ...data.user, sid: data.sid });
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
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
