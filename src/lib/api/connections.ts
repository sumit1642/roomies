// src/lib/api/connections.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	PaginatedResponse,
	ConnectionListItem,
	ConnectionDetail,
	Cursor,
	ConfirmationStatus,
} from "#/types";

/**
 * GET /connections/me — the authenticated user's connection feed.
 * Backend param is "confirmationStatus" (not "status").
 */
export async function getMyConnections(
	confirmationStatus?: ConfirmationStatus,
	cursor?: Cursor,
): Promise<PaginatedResponse<ConnectionListItem>> {
	const searchParams = new URLSearchParams();
	if (confirmationStatus) searchParams.set("confirmationStatus", confirmationStatus);
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<ConnectionListItem>>>(
		`/connections/me${query ? `?${query}` : ""}`,
	);
	return res.data;
}

/**
 * GET /connections/:connectionId — single connection with full details.
 */
export async function getConnection(connectionId: string): Promise<ConnectionDetail> {
	const res = await apiFetch<ApiSuccess<ConnectionDetail>>(`/connections/${connectionId}`);
	return res.data;
}

/**
 * POST /connections/:id/confirm
 * Records that THIS caller's side of the real-world interaction happened.
 * Both parties must call this for confirmationStatus to become "confirmed".
 */
export async function confirmConnection(connectionId: string): Promise<{
	connectionId: string;
	initiatorConfirmed: boolean;
	counterpartConfirmed: boolean;
	confirmationStatus: ConfirmationStatus;
	updatedAt: string;
}> {
	const res = await apiFetch<
		ApiSuccess<{
			connectionId: string;
			initiatorConfirmed: boolean;
			counterpartConfirmed: boolean;
			confirmationStatus: ConfirmationStatus;
			updatedAt: string;
		}>
	>(`/connections/${connectionId}/confirm`, {
		method: "POST",
	});
	return res.data;
}
