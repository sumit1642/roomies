// src/lib/api/connections.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	PaginatedResponse,
	ConnectionListItem,
	ConnectionDetail,
	Cursor,
	ConfirmationStatus,
	LegacyApiResponse,
	Connection,
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

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

function toLegacyConnection(item: ConnectionListItem): Connection {
	return {
		id: item.connectionId,
		status: item.confirmationStatus === "confirmed" ? "confirmed" : "pending",
		initiated_by: "student",
		created_at: item.createdAt,
		listing:
			item.listing ?
				{
					title: item.listing.title,
					property: { name: item.listing.city },
				}
			:	undefined,
		other_user: {
			name: item.otherParty.fullName,
			avatar_url: item.otherParty.profilePhotoUrl,
		},
	};
}

export const connectionsApi = {
	async getMyConnections(): Promise<LegacyApiResponse<Connection[]>> {
		try {
			const res = await getMyConnections();
			return ok(res.items.map(toLegacyConnection));
		} catch {
			return fail("Failed to load connections");
		}
	},

	async acceptConnection(connectionId: string): Promise<LegacyApiResponse<{ confirmationStatus: string }>> {
		try {
			const res = await confirmConnection(connectionId);
			return ok(res);
		} catch {
			return fail("Failed to confirm connection");
		}
	},

	// Declining a connection is not a backend concept at this stage.
	// Declining happens via PATCH /interests/:id/status { status: "declined" }
	// BEFORE a connection is created.
	async rejectConnection(_connectionId: string): Promise<LegacyApiResponse<null>> {
		return fail(
			"Declining a connection is not supported after it has been created. " +
				"Decline the interest request before the connection is established.",
		);
	},
};
