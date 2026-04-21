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
	Gender,
	DocumentType,
} from "#/types";

// FIX: was /students/${userId}, backend expects /students/${userId}/profile
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

// FIX: was PUT /students/${userId}, backend expects PUT /students/${userId}/profile
export async function updateStudentProfile(userId: string, data: UpdateStudentInput): Promise<StudentProfile> {
	const res = await apiFetch<ApiSuccess<StudentProfile>>(`/students/${userId}/profile`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

// FIX: backend returns { status: "success", data: { preferences: [...] } }
// was returning res.data (object), now correctly returns res.data.preferences (array)
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

// FIX: was /pg-owners/${userId}, backend expects /pg-owners/${userId}/profile
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

// FIX: was PUT /pg-owners/${userId}, backend expects PUT /pg-owners/${userId}/profile
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

// GET - correct
export async function revealStudentContact(userId: string): Promise<StudentContactReveal> {
	const res = await apiFetch<ApiSuccess<StudentContactReveal>>(`/students/${userId}/contact/reveal`);
	return res.data;
}

// FIX: must be POST not GET per backend route definition
export async function revealPgOwnerContact(userId: string): Promise<PgOwnerContactReveal> {
	const res = await apiFetch<ApiSuccess<PgOwnerContactReveal>>(`/pg-owners/${userId}/contact/reveal`, {
		method: "POST",
	});
	return res.data;
}
