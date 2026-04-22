// src/lib/api/ratings.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	PaginatedResponse,
	Rating,
	PublicRating,
	ConnectionRatings,
	RevieweeType,
	Cursor,
	LegacyApiResponse,
	SubmitRatingResponse,
} from "#/types";

// Get ratings for a connection (both parties' ratings)
export async function getConnectionRatings(connectionId: string): Promise<ConnectionRatings> {
	const res = await apiFetch<ApiSuccess<ConnectionRatings>>(`/ratings/connection/${connectionId}`);
	return res.data;
}

// Get public ratings for a user
export async function getPublicUserRatings(userId: string, cursor?: Cursor): Promise<PaginatedResponse<PublicRating>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<PublicRating>>>(
		`/ratings/user/${userId}${query ? `?${query}` : ""}`,
	);
	return res.data;
}

// Get public ratings for a property
export async function getPublicPropertyRatings(
	propertyId: string,
	cursor?: Cursor,
): Promise<PaginatedResponse<PublicRating>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<PublicRating>>>(
		`/ratings/property/${propertyId}${query ? `?${query}` : ""}`,
	);
	return res.data;
}

// Get my given ratings (authenticated)
export async function getMyGivenRatings(cursor?: Cursor): Promise<PaginatedResponse<Rating>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<Rating>>>(`/ratings/me/given${query ? `?${query}` : ""}`);
	return res.data;
}

// Backward compat
export async function getPublicRatings(
	revieweeType: RevieweeType,
	revieweeId: string,
	cursor?: Cursor,
): Promise<PaginatedResponse<PublicRating>> {
	if (revieweeType === "user") {
		return getPublicUserRatings(revieweeId, cursor);
	}
	return getPublicPropertyRatings(revieweeId, cursor);
}

export interface SubmitRatingInput {
	connectionId: string;
	revieweeType: RevieweeType;
	revieweeId: string;
	overallScore: number;
	cleanlinessScore?: number;
	communicationScore?: number;
	reliabilityScore?: number;
	valueScore?: number;
	comment?: string;
}

export async function submitRating(data: SubmitRatingInput): Promise<SubmitRatingResponse> {
	const res = await apiFetch<ApiSuccess<SubmitRatingResponse>>("/ratings", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return res.data;
}

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

export const ratingsApi = {
	async getPropertyRatings(propertyId: string): Promise<LegacyApiResponse<PublicRating[]>> {
		try {
			const res = await getPublicPropertyRatings(propertyId);
			return ok(res.items);
		} catch {
			return fail("Failed to get property ratings");
		}
	},

	async createRating(data: {
		connectionId: string;
		revieweeType: RevieweeType;
		revieweeId: string;
		overallScore: number;
		comment?: string;
	}): Promise<LegacyApiResponse<SubmitRatingResponse>> {
		try {
			const res = await submitRating(data);
			return ok(res);
		} catch {
			return fail("Failed to submit rating");
		}
	},
};
