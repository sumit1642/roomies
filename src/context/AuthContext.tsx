import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { MeResponse, AuthResponse, Role } from "#/types";
import { getMe, logout as apiLogout } from "#/lib/api/auth";

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

	const role = user?.roles[0] as Role | null;
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
			try {
				const me = await getMe();
				setUser(me);
			} catch {
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}
		hydrate();
	}, []);

	const login = useCallback((data: AuthResponse) => {
		setUser({ ...data.user, sid: data.sid });
	}, []);

	const logout = useCallback(async () => {
		try {
			await apiLogout();
		} finally {
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
