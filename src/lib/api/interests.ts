// src/lib/api/interests.ts
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

export async function getInterest(interestId: string): Promise<InterestRequest> {
	const res = await apiFetch<ApiSuccess<InterestRequest>>(`/interests/${interestId}`);
	return res.data;
}

// PG Owner: get interests for a listing (with optional status filter)
export async function getListingInterests(
	listingId: string,
	status?: RequestStatus | "accepted",
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
