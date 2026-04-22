// src/lib/api/profiles.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	StudentProfile,
	PgOwnerProfile,
	PreferencePair,
	PreferenceMetaItem,
	StudentContactReveal,
	PgOwnerContactReveal,
	StudentFullDetails,
	Gender,
	DocumentType,
} from "#/types";

export async function getStudentProfile(userId: string): Promise<StudentProfile> {
	const res = await apiFetch<ApiSuccess<StudentProfile>>(`/students/${userId}/profile`);
	return res.data;
}

export interface UpdateStudentInput {
	fullName?: string;
	bio?: string;
	course?: string;
	yearOfStudy?: number;
	gender?: Gender;
	dateOfBirth?: string;
}

export async function updateStudentProfile(userId: string, data: UpdateStudentInput): Promise<StudentProfile> {
	const res = await apiFetch<ApiSuccess<StudentProfile>>(`/students/${userId}/profile`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

export async function getPreferencesMeta(): Promise<PreferenceMetaItem[]> {
	const res = await apiFetch<ApiSuccess<{ preferences: PreferenceMetaItem[] }>>("/preferences/meta");
	return res.data.preferences;
}

export async function getStudentPreferences(userId: string): Promise<PreferencePair[]> {
	const res = await apiFetch<ApiSuccess<PreferencePair[]>>(`/students/${userId}/preferences`);
	return res.data;
}

export async function updateStudentPreferences(
	userId: string,
	preferences: PreferencePair[],
): Promise<PreferencePair[]> {
	const res = await apiFetch<ApiSuccess<PreferencePair[]>>(`/students/${userId}/preferences`, {
		method: "PUT",
		body: JSON.stringify({ preferences }),
	});
	return res.data;
}

export async function getPgOwnerProfile(userId: string): Promise<PgOwnerProfile> {
	const res = await apiFetch<ApiSuccess<PgOwnerProfile>>(`/pg-owners/${userId}/profile`);
	return res.data;
}

export interface UpdatePgOwnerInput {
	businessName?: string;
	ownerFullName?: string;
	businessDescription?: string;
	businessPhone?: string;
	operatingSince?: number;
}

export async function updatePgOwnerProfile(userId: string, data: UpdatePgOwnerInput): Promise<PgOwnerProfile> {
	const res = await apiFetch<ApiSuccess<PgOwnerProfile>>(`/pg-owners/${userId}/profile`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

export interface SubmitDocumentInput {
	documentType: DocumentType;
	documentUrl: string;
}

export async function submitVerificationDocument(userId: string, data: SubmitDocumentInput): Promise<void> {
	await apiFetch<ApiMessage>(`/pg-owners/${userId}/documents`, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

// Student contact reveal — GET request
// Returns email only for guests/unverified; email + whatsapp for verified users
export async function revealStudentContact(userId: string): Promise<StudentContactReveal> {
	const res = await apiFetch<ApiSuccess<StudentContactReveal>>(`/students/${userId}/contact/reveal`);
	return res.data;
}

// PG Owner contact reveal — POST request (consumes quota slot)
export async function revealPgOwnerContact(userId: string): Promise<PgOwnerContactReveal> {
	const res = await apiFetch<ApiSuccess<PgOwnerContactReveal>>(`/pg-owners/${userId}/contact/reveal`, {
		method: "POST",
	});
	return res.data;
}

/**
 * Get full student details for owner view.
 * Combines profile + contact reveal into a single convenient call.
 * Returns null if either call fails.
 */
export async function getStudentFullDetails(userId: string): Promise<StudentFullDetails | null> {
	try {
		const [profile, contact] = await Promise.all([getStudentProfile(userId), revealStudentContact(userId)]);

		return {
			userId: profile.user_id,
			fullName: profile.full_name,
			profilePhotoUrl: profile.profile_photo_url,
			bio: profile.bio,
			course: profile.course,
			yearOfStudy: profile.year_of_study,
			gender: profile.gender,
			isAadhaarVerified: profile.is_aadhaar_verified,
			averageRating: profile.average_rating,
			ratingCount: profile.rating_count,
			email: contact.email,
			whatsappPhone: contact.whatsapp_phone,
		};
	} catch {
		return null;
	}
}
