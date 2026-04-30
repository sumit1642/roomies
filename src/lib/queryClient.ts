// src/lib/queryClient.ts
// Singleton QueryClient with data-classified staleTime values.
// Optional sessionStorage persistence for safe-to-persist queries (prod only).

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// ── Data-classified stale times (ms) ──────────────────────────────────────────
export const STALE = {
	STATIC: 60 * 60 * 1000, //  1 hour  — amenities, enums (changes only on admin action)
	PROFILE: 5 * 60 * 1000, //  5 min   — user/owner profile
	SESSIONS: 2 * 60 * 1000, //  2 min   — active sessions list
	FEED: 2 * 60 * 1000, //  2 min   — listings browse feed
	TRANSACTIONAL: 30 * 1000, // 30 sec  — interests, connections (more time-sensitive)
	NOTIFICATION: 30 * 1000, // 30 sec  — notifications / unread count
} as const;

// ── Query keys safe to persist to sessionStorage ───────────────────────────────
// Do NOT persist: contact reveals (email/phone), session tokens, or notification content.
// Safe: amenities, user profile, public listing data.
const PERSIST_KEY_PREFIXES = ["amenities", "profile"];

// ── Singleton QueryClient ──────────────────────────────────────────────────────
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: STALE.FEED, // sensible app-wide default
			gcTime: 10 * 60 * 1000, // keep unused data in memory for 10 min
			retry: 1,
			refetchOnWindowFocus: false, // prevent aggressive refetch on tab switch
		},
	},
});

// ── Optional persistence (prod only) ──────────────────────────────────────────
// Only activate in browser + production. Never persists auth tokens or PII.
if (typeof window !== "undefined" && import.meta.env.PROD) {
	try {
		const persister = createSyncStoragePersister({
			storage: window.sessionStorage,
			key: "roomies_query_cache",
		});

		persistQueryClient({
			queryClient,
			persister,
			maxAge: 30 * 60 * 1000, // 30 min max persistence window
			dehydrateOptions: {
				shouldDehydrateQuery: (query) => {
					const firstKey = String(query.queryKey[0]);
					return PERSIST_KEY_PREFIXES.some((prefix) => firstKey.startsWith(prefix));
				},
			},
		});
	} catch {
		// sessionStorage may be blocked in private browsing — degrade gracefully
	}
}
