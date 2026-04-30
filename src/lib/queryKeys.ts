// src/lib/queryKeys.ts
// Centralized, typed query key factory.
// All queryKey arrays live here — prevents typos and makes invalidateQueries calls consistent.

export const queryKeys = {
	// ── Auth / Sessions ────────────────────────────────────────────────────────
	sessions: () => ["sessions"] as const,

	// ── Notifications ──────────────────────────────────────────────────────────
	notifications: {
		list: (isRead?: boolean) => ["notifications", "list", { isRead }] as const,
		unreadCount: () => ["notifications", "unread-count"] as const,
	},

	// ── Profiles ───────────────────────────────────────────────────────────────
	studentProfile: (userId: string) => ["profile", "student", userId] as const,
	pgOwnerProfile: (userId: string) => ["profile", "pg-owner", userId] as const,

	// ── Interests ──────────────────────────────────────────────────────────────
	interests: (status?: string) => ["interests", { status }] as const,

	// ── Connections ────────────────────────────────────────────────────────────
	connections: (status?: string) => ["connections", { status }] as const,
	connection: (id: string) => ["connections", "detail", id] as const,
	connectionRatings: (id: string) => ["connections", "ratings", id] as const,

	// ── Listings ───────────────────────────────────────────────────────────────
	listings: (filters: object) => ["listings", "search", filters] as const,
	listing: (id: string) => ["listing", id] as const,
	savedListings: () => ["saved-listings"] as const,

	// ── Properties ─────────────────────────────────────────────────────────────
	properties: () => ["properties"] as const,

	// ── Amenities (near-static) ────────────────────────────────────────────────
	amenities: () => ["amenities"] as const,
} as const;
