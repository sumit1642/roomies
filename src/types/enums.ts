export const AccountStatus = {
	ACTIVE: "active",
	SUSPENDED: "suspended",
	BANNED: "banned",
	DEACTIVATED: "deactivated",
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const UserRole = {
	STUDENT: "student",
	PG_OWNER: "pg_owner",
	ADMIN: "admin",
} as const;
export type Role = (typeof UserRole)[keyof typeof UserRole];

export const Gender = {
	MALE: "male",
	FEMALE: "female",
	OTHER: "other",
	PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const GenderPreference = {
	MALE: "male",
	FEMALE: "female",
	OTHER: "other",
	ANY: "prefer_not_to_say",
} as const;

export const VerificationStatus = {
	UNVERIFIED: "unverified",
	PENDING: "pending",
	VERIFIED: "verified",
	REJECTED: "rejected",
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ListingType = {
	STUDENT_ROOM: "student_room",
	PG_ROOM: "pg_room",
	HOSTEL_BED: "hostel_bed",
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

export const RoomType = {
	SINGLE: "single",
	DOUBLE: "double",
	TRIPLE: "triple",
	ENTIRE_FLAT: "entire_flat",
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const FurnishingType = {
	FULLY_FURNISHED: "fully_furnished",
	SEMI_FURNISHED: "semi_furnished",
	UNFURNISHED: "unfurnished",
} as const;
export type FurnishingType = (typeof FurnishingType)[keyof typeof FurnishingType];

export const BedType = {
	SINGLE_BED: "single_bed",
	DOUBLE_BED: "double_bed",
	BUNK_BED: "bunk_bed",
} as const;
export type BedType = (typeof BedType)[keyof typeof BedType];

export const ListingStatus = {
	ACTIVE: "active",
	FILLED: "filled",
	EXPIRED: "expired",
	DEACTIVATED: "deactivated",
	INACTIVE: "deactivated",
} as const;
export type ListingStatus = (typeof ListingStatus)[Exclude<keyof typeof ListingStatus, "INACTIVE">] | "deactivated";

export const PropertyType = {
	PG: "pg",
	HOSTEL: "hostel",
	SHARED_APARTMENT: "shared_apartment",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PropertyStatus = {
	ACTIVE: "active",
	INACTIVE: "inactive",
	UNDER_REVIEW: "under_review",
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const RequestStatus = {
	PENDING: "pending",
	ACCEPTED: "accepted",
	DECLINED: "declined",
	WITHDRAWN: "withdrawn",
	EXPIRED: "expired",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const InterestStatus = {
	PENDING: "pending",
	ACCEPTED: "accepted",
	REJECTED: "declined",
} as const;

export const ConfirmationStatus = {
	PENDING: "pending",
	CONFIRMED: "confirmed",
	DENIED: "denied",
	EXPIRED: "expired",
} as const;
export type ConfirmationStatus = (typeof ConfirmationStatus)[keyof typeof ConfirmationStatus];

export const ConnectionStatus = {
	PENDING: "pending",
	ACCEPTED: "confirmed",
	REJECTED: "denied",
} as const;

export const ConnectionType = {
	STUDENT_ROOMMATE: "student_roommate",
	PG_STAY: "pg_stay",
	HOSTEL_STAY: "hostel_stay",
	VISIT_ONLY: "visit_only",
} as const;
export type ConnectionType = (typeof ConnectionType)[keyof typeof ConnectionType];

export const RevieweeType = {
	USER: "user",
	PROPERTY: "property",
} as const;
export type RevieweeType = (typeof RevieweeType)[keyof typeof RevieweeType];

export const ReportReason = {
	FAKE: "fake",
	ABUSIVE: "abusive",
	CONFLICT_OF_INTEREST: "conflict_of_interest",
	OTHER: "other",
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
	OPEN: "open",
	RESOLVED_REMOVED: "resolved_removed",
	RESOLVED_KEPT: "resolved_kept",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const NotificationType = {
	NEW_INTEREST: "interest_request_received",
	INTEREST_ACCEPTED: "interest_request_accepted",
	INTEREST_REJECTED: "interest_request_declined",
	INTEREST_WITHDRAWN: "interest_request_withdrawn",
	CONNECTION_CONFIRMED: "connection_confirmed",
	CONNECTION_REQUESTED: "connection_requested",
	NEW_RATING: "rating_received",
	LISTING_EXPIRING: "listing_expiring",
	LISTING_EXPIRED: "listing_expired",
	LISTING_UPDATE: "listing_filled",
	VERIFICATION_APPROVED: "verification_approved",
	VERIFICATION_REJECTED: "verification_rejected",
	VERIFICATION_PENDING: "verification_pending",
	NEW_MESSAGE: "new_message",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const DocumentType = {
	PROPERTY_DOCUMENT: "property_document",
	RENTAL_AGREEMENT: "rental_agreement",
	OWNER_ID: "owner_id",
	TRADE_LICENSE: "trade_license",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const AmenityCategory = {
	UTILITY: "utility",
	SAFETY: "safety",
	COMFORT: "comfort",
} as const;
export type AmenityCategory = (typeof AmenityCategory)[keyof typeof AmenityCategory];

export const CommonAmenity = {
	WIFI: "wifi",
	AC: "ac",
	COOLER: "cooler",
	POWER_BACKUP: "power_backup",
	GEYSER: "geyser",
	LAUNDRY: "laundry",
	CCTV: "cctv",
	SECURITY_GUARD: "security_guard",
	FIRE_SAFETY: "fire_safety",
	LIFT: "lift",
	PARKING: "parking",
	MEALS: "meals",
	HOUSEKEEPING: "housekeeping",
	RO_WATER: "ro_water",
	ATTACHED_BATHROOM: "attached_bathroom",
	WARDROBE: "wardrobe",
	STUDY_TABLE: "study_table",
	BALCONY: "balcony",
	GYM: "gym",
} as const;

export const PreferenceKey = {
	SMOKING: "smoking",
	FOOD_HABIT: "food_habit",
	SLEEP_SCHEDULE: "sleep_schedule",
	ALCOHOL: "alcohol",
	CLEANLINESS_LEVEL: "cleanliness_level",
	NOISE_TOLERANCE: "noise_tolerance",
	GUEST_POLICY: "guest_policy",
} as const;
export type PreferenceKey = (typeof PreferenceKey)[keyof typeof PreferenceKey];
