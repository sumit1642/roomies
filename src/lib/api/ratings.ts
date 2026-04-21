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
} from "#/types";

// Get ratings for a connection
export async function getConnectionRatings(connectionId: string): Promise<ConnectionRatings> {
	const res = await apiFetch<ApiSuccess<ConnectionRatings>>(`/ratings/connection/${connectionId}`);
	return res.data;
}

// Get public ratings for a user or property
export async function getPublicRatings(
	revieweeType: RevieweeType,
	revieweeId: string,
	cursor?: Cursor,
): Promise<PaginatedResponse<PublicRating>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<PublicRating>>>(
		`/ratings/${revieweeType}/${revieweeId}${query ? `?${query}` : ""}`,
	);
	return res.data;
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

export async function submitRating(data: SubmitRatingInput): Promise<Rating> {
	const res = await apiFetch<ApiSuccess<Rating>>("/ratings", {
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
	async getPropertyRatings(_propertyId: string): Promise<LegacyApiResponse<Rating[]>> {
		return ok([]);
	},

	async createRating(data: {
		property_id: string;
		rating: number;
		comment?: string;
	}): Promise<LegacyApiResponse<Rating>> {
		try {
			const res = await submitRating({
				connectionId: "00000000-0000-0000-0000-000000000000",
				revieweeType: "property",
				revieweeId: data.property_id,
				overallScore: data.rating,
				comment: data.comment,
			});
			return ok(res);
		} catch {
			return fail("Failed to submit rating");
		}
	},
};
