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
export interface Property {
	property_id: string;
	owner_id: string;
	id?: string;
	property_name: string;
	name?: string;
	description: string | null;
	property_type: PropertyType;
	address_line: string;
	address?: string;
	city: string;
	state?: string;
	locality: string | null;
	landmark: string | null;
	pincode: string | null;
	is_verified?: boolean;
	rating?: number;
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
export interface PropertyListItem extends Property {
	amenity_count: number;
	active_listing_count: number;
}

// ── Listings ──────────────────────────────────────────────────────────────────
export interface ListingPhoto {
	photoId: string;
	photoUrl: string;
	isCover: boolean;
	displayOrder: number;
	createdAt: string;
}
export interface ListingSearchItem {
	listingId: string;
	listingType: ListingType;
	title: string;
	city: string;
	locality: string | null;
	rentPerMonth: number;
	depositAmount: number;
	compatibilityScore: number;
	compatibilityAvailable: boolean;
	roomType: RoomType;
	preferredGender: Gender | null;
	availableFrom: string;
	status: ListingStatus;
	coverPhotoUrl?: string | null;
	cover_photo_url?: string | null;
	average_rating?: number;
	property_name?: string | null;
}
export interface ListingDetail {
	listingId: string;
	postedBy: string;
	propertyId: string | null;
	listingType: ListingType;
	title: string;
	description: string | null;
	rentPerMonth: number;
	depositAmount: number;
	rentIncludesUtilities: boolean;
	isNegotiable: boolean;
	roomType: RoomType;
	bedType: BedType | null;
	totalCapacity: number;
	currentOccupants: number;
	preferredGender: Gender | null;
	availableFrom: string;
	availableUntil: string | null;
	addressLine: string | null;
	city: string;
	locality: string | null;
	landmark: string | null;
	pincode: string | null;
	latitude: number | null;
	longitude: number | null;
	status: ListingStatus;
	viewsCount: number;
	expiresAt: string | null;
	poster_rating: number;
	poster_rating_count: number;
	poster_name: string;
	amenities: Amenity[];
	preferences: PreferencePair[];
	photos: ListingPhoto[];
	property: Property | null;
}
// Saved listings uses legacy snake_case from the backend
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
export interface InterestRequest {
	interestRequestId: string;
	studentId: string;
	listingId: string;
	message: string | null;
	status: RequestStatus;
	createdAt: string;
	updatedAt: string;
}
export interface InterestRequestWithStudent extends InterestRequest {
	student: {
		userId: string;
		fullName: string;
		profilePhotoUrl: string | null;
		averageRating: number;
	};
}
export interface InterestRequestWithListing extends InterestRequest {
	listing: {
		listingId: string;
		title: string;
		city: string;
		listingType: ListingType;
		rentPerMonth: number;
	};
}
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

// ── Ratings ───────────────────────────────────────────────────────────────────
export interface Rating {
	ratingId: string;
	id?: string;
	reviewerId: string;
	rating?: number;
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
	created_at?: string;
	user?: {
		name?: string;
		avatar_url?: string | null;
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

// FIX: backend returns { count: number }, was { unreadCount: number }
export interface UnreadCountResponse {
	count: number;
}

// ── Legacy compatibility route types ─────────────────────────────────────────
export interface ListingFilters {
	city?: string;
	room_type?: RoomType;
	min_rent?: number;
	max_rent?: number;
	gender_preference?: Gender;
}

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
