// src/types/api.ts
import type {
	Role,
	Gender,
	VerificationStatus,
	ListingType,
	RoomType,
	BedType,
	ListingStatus,
	PropertyType,
	PropertyStatus,
	RequestStatus,
	ConfirmationStatus,
	ConnectionType,
	RevieweeType,
	NotificationType,
	AmenityCategory,
	PreferenceKey,
} from "./enums";

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
	userId: string;
	email: string;
	roles: Role[];
	role?: Role;
	isEmailVerified: boolean;
}

export interface AuthResponse {
	user: AuthUser;
	sid: string;
	accessToken: string;
	refreshToken: string;
}

export interface MeResponse extends AuthUser {
	sid: string;
}

export interface SessionItem {
	sid: string;
	isCurrent: boolean;
	expiresAt: string;
	issuedAt: string;
}

// ── Cursor ────────────────────────────────────────────────────────────────────
export interface Cursor {
	cursorTime: string;
	cursorId: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	nextCursor: Cursor | null;
}

// ── API envelope ──────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
	status: "success";
	data: T;
}

export interface ApiMessage {
	status: "success";
	message: string;
}

export interface ApiError {
	status: "error";
	message: string;
	errors?: { field: string; message: string }[];
	code?: string;
	loginRedirect?: string;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

/** Matches backend GET /students/:userId/profile response */
export interface StudentProfile {
	profile_id: string;
	user_id: string;
	full_name: string;
	date_of_birth: string | null;
	gender: Gender | null;
	profile_photo_url: string | null;
	bio: string | null;
	course: string | null;
	year_of_study: number | null;
	institution_id: string | null;
	is_aadhaar_verified: boolean;
	email: string | null;
	is_email_verified: boolean;
	average_rating: number;
	rating_count: number;
	created_at: string;
}

/** Matches backend GET /pg-owners/:userId/profile response */
export interface PgOwnerProfile {
	profile_id: string;
	user_id: string;
	business_name: string;
	owner_full_name: string;
	business_description: string | null;
	business_phone: string | null;
	operating_since: number | null;
	verification_status: VerificationStatus;
	verified_at: string | null;
	email: string | null;
	is_email_verified: boolean;
	average_rating: number;
	rating_count: number;
	created_at: string;
}

// ── Preferences ───────────────────────────────────────────────────────────────
export interface PreferencePair {
	preferenceKey: PreferenceKey;
	preferenceValue: string;
}

export interface PreferenceMetaValue {
	value: string;
	label: string;
}

export interface PreferenceMetaItem {
	preferenceKey: PreferenceKey;
	label: string;
	values: PreferenceMetaValue[];
}

// ── Properties ────────────────────────────────────────────────────────────────
export interface Amenity {
	amenityId: string;
	name: string;
	category: AmenityCategory;
	iconName: string;
}

/** Matches backend GET /properties/:propertyId response */
export interface Property {
	property_id: string;
	owner_id: string;
	property_name: string;
	description: string | null;
	property_type: PropertyType;
	address_line: string;
	city: string;
	locality: string | null;
	landmark: string | null;
	pincode: string | null;
	latitude: number | null;
	longitude: number | null;
	house_rules: string | null;
	total_rooms: number | null;
	status: PropertyStatus;
	average_rating: number;
	rating_count: number;
	amenities: Amenity[];
	created_at: string;
	updated_at: string;
}

/** Matches backend GET /properties (list) response items */
export interface PropertyListItem {
	property_id: string;
	owner_id?: string;
	property_name: string;
	description: string | null;
	property_type: PropertyType;
	address_line: string;
	city: string;
	locality: string | null;
	landmark: string | null;
	pincode: string | null;
	house_rules: string | null;
	status: PropertyStatus;
	average_rating: number;
	rating_count: number;
	amenity_count: number;
	active_listing_count: number;
	created_at: string;
	updated_at: string;
}

// ── Listings ──────────────────────────────────────────────────────────────────
export interface ListingPhoto {
	photoId: string;
	photoUrl: string;
	isCover: boolean;
	displayOrder: number;
	createdAt: string;
}

/**
 * Matches backend GET /listings (searchListings) response items.
 * Snake_case = raw DB columns. CamelCase = JS transformations.
 */
export interface ListingSearchItem {
	listing_id: string;
	listing_type: ListingType;
	title: string;
	city: string;
	locality: string | null;
	room_type: RoomType;
	preferred_gender: Gender | null;
	available_from: string;
	status: ListingStatus;
	created_at: string;
	posted_by: string;
	property_id: string | null;
	property_name: string | null;
	average_rating: number;
	cover_photo_url: string | null;
	// CamelCase — JS-side transformations (toRupees)
	rentPerMonth: number;
	depositAmount: number;
	compatibilityScore: number;
	compatibilityAvailable: boolean;
}

export interface ListingDetail {
	// Core listing fields — snake_case from pg (spread by toRupees)
	listing_id: string;
	posted_by: string;
	property_id: string | null;
	listing_type: ListingType;
	title: string;
	description: string | null;
	room_type: RoomType;
	bed_type: BedType | null;
	total_capacity: number;
	current_occupants: number;
	preferred_gender: Gender | null;
	available_from: string;
	available_until: string | null;
	address_line: string | null;
	city: string;
	locality: string | null;
	landmark: string | null;
	pincode: string | null;
	latitude: number | null;
	longitude: number | null;
	status: ListingStatus;
	views_count: number;
	expires_at: string | null;
	created_at: string;
	updated_at: string;
	rent_includes_utilities: boolean;
	is_negotiable: boolean;
	// CamelCase (toRupees transform)
	rentPerMonth: number;
	depositAmount: number;
	// From JOINs — snake_case aliases
	poster_rating: number;
	poster_rating_count: number;
	poster_name: string;
	// Aggregated JSON from SELECT
	amenities: Amenity[];
	preferences: PreferencePair[];
	photos: ListingPhoto[];
	property: ListingPropertySummary | null;
	// Compatibility (only present if fetched with userId)
	compatibilityScore?: number;
	compatibilityAvailable?: boolean;
}

/** Embedded property summary within listing detail — camelCase (JSONB_BUILD_OBJECT) */
export interface ListingPropertySummary {
	propertyId: string;
	propertyName: string;
	propertyType: PropertyType;
	addressLine: string;
	city: string;
	locality: string | null;
	latitude: number | null;
	longitude: number | null;
	houseRules: string | null;
	averageRating: number;
	ratingCount: number;
}

/**
 * Matches backend GET /listings/me/saved (getSavedListings) response items.
 */
export interface SavedListingItem {
	listing_id: string;
	listing_type: ListingType;
	title: string;
	city: string;
	locality: string | null;
	room_type: RoomType;
	preferred_gender: Gender | null;
	available_from: string;
	status: ListingStatus;
	saved_at: string;
	property_name: string | null;
	average_rating: number;
	cover_photo_url: string | null;
	rentPerMonth: number;
	depositAmount: number;
}

// ── Interest Requests ─────────────────────────────────────────────────────────

/** Base interest request — camelCase (explicit .map() in service) */
export interface InterestRequest {
	interestRequestId: string;
	studentId: string;
	listingId: string;
	message: string | null;
	status: RequestStatus;
	createdAt: string;
	updatedAt: string;
}

/** Interest request with embedded student info (poster's view) */
export interface InterestRequestWithStudent extends InterestRequest {
	student: {
		userId: string;
		fullName: string;
		profilePhotoUrl: string | null;
		averageRating: number;
	};
}

/** Interest request with embedded listing info (student's view) */
export interface InterestRequestWithListing extends InterestRequest {
	listing: {
		listingId: string;
		title: string;
		city: string;
		listingType: ListingType;
		rentPerMonth: number;
	};
}

/** Response when interest is accepted */
export interface AcceptedInterestResponse {
	interestRequestId: string;
	studentId: string;
	listingId: string;
	status: "accepted";
	connectionId: string;
	whatsappLink: string | null;
	listingFilled: boolean;
}

// ── Connections ───────────────────────────────────────────────────────────────
// All camelCase — explicit .map() in connection.service.js

export interface ConnectionListItem {
	connectionId: string;
	connectionType: ConnectionType;
	confirmationStatus: ConfirmationStatus;
	initiatorConfirmed: boolean;
	counterpartConfirmed: boolean;
	startDate: string | null;
	endDate: string | null;
	createdAt: string;
	updatedAt: string;
	listing: {
		listingId: string;
		title: string;
		city: string;
		rentPerMonth: number | null;
		listingType: ListingType;
	} | null;
	otherParty: {
		userId: string;
		fullName: string;
		profilePhotoUrl: string | null;
		averageRating: number;
	};
}

export interface ConnectionDetail extends ConnectionListItem {
	interestRequestId: string | null;
	otherParty: ConnectionListItem["otherParty"] & { ratingCount: number };
}

// ── Notifications ─────────────────────────────────────────────────────────────
// All camelCase — explicit .map() in notification.service.js

export interface Notification {
	notificationId: string;
	actorId: string | null;
	type: NotificationType;
	entityType: string | null;
	entityId: string | null;
	message: string;
	isRead: boolean;
	createdAt: string;
}

export interface UnreadCountResponse {
	count: number;
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export interface Rating {
	ratingId: string;
	reviewerId: string;
	revieweeType: RevieweeType;
	revieweeId: string;
	overallScore: number;
	cleanlinessScore: number | null;
	communicationScore: number | null;
	reliabilityScore: number | null;
	valueScore: number | null;
	comment: string | null;
	isVisible: boolean;
	createdAt: string;
	connectionId?: string;
	reviewee?: {
		fullName: string;
		profilePhotoUrl: string | null;
		type: RevieweeType;
	};
}

export interface PublicRating {
	ratingId: string;
	overallScore: number;
	cleanlinessScore: number | null;
	communicationScore: number | null;
	reliabilityScore: number | null;
	valueScore: number | null;
	comment: string | null;
	createdAt: string;
	reviewer: { fullName: string; profilePhotoUrl: string | null };
}

export interface ConnectionRatings {
	myRatings: Rating[];
	theirRatings: Rating[];
}

export interface SubmitRatingResponse {
	ratingId: string;
	createdAt: string;
}

// ── Contact Reveal ────────────────────────────────────────────────────────────

export interface StudentContactReveal {
	user_id: string;
	full_name: string;
	email: string;
	whatsapp_phone?: string;
}

export interface PgOwnerContactReveal {
	user_id: string;
	owner_full_name: string;
	business_name: string;
	email: string;
	whatsapp_phone?: string;
}

// ── Student full details for owner view ───────────────────────────────────────
// Used when owner clicks on a student card to reveal full details

export interface StudentFullDetails {
	// From student profile
	userId: string;
	fullName: string;
	profilePhotoUrl: string | null;
	bio: string | null;
	course: string | null;
	yearOfStudy: number | null;
	gender: Gender | null;
	isAadhaarVerified: boolean;
	averageRating: number;
	ratingCount: number;
	// From contact reveal (email only or full)
	email: string;
	whatsappPhone?: string;
}

// ── Listing filters (frontend search form state) ───────────────────────────────

export interface ListingFilters {
	city?: string;
	room_type?: RoomType;
	min_rent?: number;
	max_rent?: number;
	gender_preference?: Gender;
}

// ── Legacy compatibility types ────────────────────────────────────────────────

export interface Listing {
	id: string;
	title: string;
	description?: string | null;
	property_id?: string;
	property?: {
		id?: string;
		name?: string;
		city?: string;
		state?: string;
		address?: string;
		pincode?: string;
		rating?: number;
		rating_count?: number;
	};
	owner?: {
		name?: string;
		avatar_url?: string | null;
		phone?: string;
		email?: string;
	};
	room_type: RoomType;
	furnishing_type?: string;
	gender_preference: Gender;
	rent_amount: number;
	deposit_amount: number;
	available_from: string;
	amenities?: string[];
	status?: string;
	is_saved?: boolean;
	has_expressed_interest?: boolean;
	interest_status?: string | null;
}

export interface Connection {
	id: string;
	status: string;
	initiated_by: "student" | "owner";
	created_at: string;
	message?: string | null;
	listing?: {
		title?: string;
		property?: { name?: string };
	};
	other_user?: {
		name?: string;
		avatar_url?: string | null;
		phone?: string;
		email?: string;
	};
}

export interface LegacyApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
}

export interface LegacyProperty {
	id: string;
	name: string;
	address: string;
	city: string;
	state: string;
	pincode: string;
	description: string | null;
	is_verified: boolean;
}
