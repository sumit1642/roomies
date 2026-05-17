// src/lib/api/roommates.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	PaginatedResponse,
	RoommateProfile,
	RoommateProfileUpdate,
} from "#/types";

export interface RoommateFeedParams {
	city?: string;
	cursorTime?: string;
	cursorId?: string;
	limit?: number;
}

/**
 * GET /students/roommates
 * Returns a paginated feed of students who have opted in to roommate matching.
 * Requires student role.
 */
export async function getRoommateFeed(params?: RoommateFeedParams): Promise<PaginatedResponse<RoommateProfile>> {
	const searchParams = new URLSearchParams();
	if (params?.city) searchParams.set("city", params.city);
	if (params?.cursorTime) searchParams.set("cursorTime", params.cursorTime);
	if (params?.cursorId) searchParams.set("cursorId", params.cursorId);
	if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<RoommateProfile>>>(
		`/students/roommates${query ? `?${query}` : ""}`,
	);
	return res.data;
}

/**
 * PUT /students/:userId/roommate-profile
 * Opt in / opt out of roommate matching for the authenticated student.
 */
export async function updateRoommateProfile(userId: string, data: RoommateProfileUpdate): Promise<RoommateProfile> {
	const res = await apiFetch<ApiSuccess<RoommateProfile>>(`/students/${userId}/roommate-profile`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

/**
 * POST /students/:userId/block/:targetUserId
 * Block a user from appearing in the roommate feed.
 */
export async function blockUser(userId: string, targetUserId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/students/${userId}/block/${targetUserId}`, { method: "POST" });
}

/**
 * DELETE /students/:userId/block/:targetUserId
 * Unblock a previously blocked user.
 */
export async function unblockUser(userId: string, targetUserId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/students/${userId}/block/${targetUserId}`, { method: "DELETE" });
}
