import { apiFetch } from "../api";
import type {
	ApiSuccess,
	PaginatedResponse,
	InterestRequest,
	InterestRequestWithStudent,
	InterestRequestWithListing,
	AcceptedInterestResponse,
	Cursor,
	RequestStatus,
	LegacyApiResponse,
} from "#/types";

// Student: send interest
export async function sendInterest(listingId: string, message?: string): Promise<InterestRequest> {
	const res = await apiFetch<ApiSuccess<InterestRequest>>(`/listings/${listingId}/interests`, {
		method: "POST",
		body: JSON.stringify({ message }),
	});
	return res.data;
}

// Student: get my sent interests
export async function getMyInterests(
	status?: RequestStatus,
	cursor?: Cursor,
): Promise<PaginatedResponse<InterestRequestWithListing>> {
	const searchParams = new URLSearchParams();
	if (status) searchParams.set("status", status);
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<InterestRequestWithListing>>>(
		`/interests/me${query ? `?${query}` : ""}`,
	);
	return res.data;
}

// PG Owner: get interests for a listing
export async function getListingInterests(
	listingId: string,
	status?: RequestStatus,
	cursor?: Cursor,
): Promise<PaginatedResponse<InterestRequestWithStudent>> {
	const searchParams = new URLSearchParams();
	if (status) searchParams.set("status", status);
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<InterestRequestWithStudent>>>(
		`/listings/${listingId}/interests${query ? `?${query}` : ""}`,
	);
	return res.data;
}

// Update interest status (accept, decline, withdraw)
export async function updateInterestStatus(
	interestId: string,
	status: "accepted" | "declined" | "withdrawn",
): Promise<InterestRequest | AcceptedInterestResponse> {
	const res = await apiFetch<ApiSuccess<InterestRequest | AcceptedInterestResponse>>(
		`/interests/${interestId}/status`,
		{
			method: "PATCH",
			body: JSON.stringify({ status }),
		},
	);
	return res.data;
}

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

export const interestsApi = {
	async expressInterest(data: { listing_id: string; message?: string }): Promise<LegacyApiResponse<InterestRequest>> {
		try {
			const res = await sendInterest(data.listing_id, data.message);
			return ok(res);
		} catch {
			return fail("Failed to express interest");
		}
	},
};
