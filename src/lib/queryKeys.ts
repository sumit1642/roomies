// src/lib/queryKeys.ts
// Centralized, typed query key factory.
// All queryKey arrays live here — prevents typos and makes invalidateQueries calls consistent.

export const queryKeys = {
	// ── Auth / Sessions ────────────────────────────────────────────────────────
	auth: {
		me: () => ["auth", "me"] as const,
	},
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
	listingInterests: (listingId: string, status?: string) =>
		["listing", listingId, "interests", { status }] as const,

	// ── Connections ────────────────────────────────────────────────────────────
	connections: (status?: string) => ["connections", { status }] as const,
	connection: (id: string) => ["connections", "detail", id] as const,
	connectionRatings: (id: string) => ["connections", "ratings", id] as const,

	// ── Listings ───────────────────────────────────────────────────────────────
	listings: (filters: object) => ["listings", "search", filters] as const,
	listing: (id: string) => ["listing", id] as const,
	listingAnalytics: (listingId: string) => ["listing", listingId, "analytics"] as const,
	savedListings: () => ["saved-listings"] as const,

	// ── Properties ─────────────────────────────────────────────────────────────
	properties: () => ["properties"] as const,

	// ── Amenities (near-static) ────────────────────────────────────────────────
	amenities: () => ["amenities"] as const,

	// ── Preference metadata (near-static) ─────────────────────────────────────
	preferenceMeta: () => ["preference-meta"] as const,

	// ── Roommate profiles ─────────────────────────────────────────────────────
	roommateProfile: (userId: string) => ["roommate-profile", userId] as const,

	// ── Ratings ───────────────────────────────────────────────────────────────
	publicUserRatings: (userId: string) => ["ratings", "user", userId] as const,
	publicPropertyRatings: (propertyId: string) => ["ratings", "property", propertyId] as const,
	myGivenRatings: () => ["ratings", "me", "given"] as const,

	// ── Saved Searches ────────────────────────────────────────────────────────
	savedSearches: () => ["saved-searches"] as const,

	// ── Rent Index ────────────────────────────────────────────────────────────
	rentIndex: (params: { city: string; locality: string; roomType: string }) =>
		["rent-index", params] as const,

	// ── Admin ─────────────────────────────────────────────────────────────────
	adminVerificationQueue: () => ["admin", "verification-queue"] as const,
	adminReportQueue: () => ["admin", "report-queue"] as const,
} as const;
