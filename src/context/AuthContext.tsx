import { createContext, useContext, useCallback } from "react";
import type { ReactNode } from "react";
import type { MeResponse, AuthResponse, Role } from "#/types";
import { logout as apiLogout } from "#/lib/api/auth";
import { tokenStore } from "#/lib/api";
import { queryClient } from "#/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { authMeQueryOptions } from "#/lib/queryOptions";
import { queryKeys } from "#/lib/queryKeys";

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
	const {
		data: user = null,
		isPending,
		refetch,
	} = useQuery({
		...authMeQueryOptions(),
		enabled: !(import.meta.env.PROD && !tokenStore.hasTokens()),
	});

	const role = user?.roles[0] as Role | null;
	const isEmailVerified = user?.isEmailVerified ?? false;
	const isLoading = import.meta.env.PROD && !tokenStore.hasTokens() ? false : isPending;

	const refreshUser = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const login = useCallback((data: AuthResponse) => {
		if (import.meta.env.PROD) {
			if (data.accessToken && data.refreshToken) {
				tokenStore.setTokens(data.accessToken, data.refreshToken);
			} else {
				console.warn("[AuthContext] login() called without tokens in production — auth may not persist");
			}
		}
		queryClient.setQueryData(queryKeys.auth.me(), { ...data.user, sid: data.sid });
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
			tokenStore.clearTokens();
			queryClient.clear();
		}
	}, []);

	return (
		<AuthContext.Provider value={{ user, isLoading, role, isEmailVerified, login, logout, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
