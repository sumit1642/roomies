// src/lib/api/notifications.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	PaginatedResponse,
	Notification,
	UnreadCountResponse,
	Cursor,
	LegacyApiResponse,
} from "#/types";

// FIX: was using "filter" param, backend expects isRead=true/false
export async function getNotifications(isRead?: boolean, cursor?: Cursor): Promise<PaginatedResponse<Notification>> {
	const searchParams = new URLSearchParams();
	if (isRead !== undefined) searchParams.set("isRead", String(isRead));
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<Notification>>>(
		`/notifications${query ? `?${query}` : ""}`,
	);
	return res.data;
}

// FIX: backend returns { count: number }, not { unreadCount: number }
export async function getUnreadCount(): Promise<number> {
	const res = await apiFetch<ApiSuccess<UnreadCountResponse>>("/notifications/unread-count");
	return res.data.count;
}

// markAsRead is the correct endpoint: POST /notifications/mark-read
// with body { notificationIds: [...] } or { all: true }
export async function markAsRead(notificationIds?: string[]): Promise<void> {
	await apiFetch<ApiMessage>("/notifications/mark-read", {
		method: "POST",
		body: JSON.stringify(notificationIds ? { notificationIds } : { all: true }),
	});
}

// FIX: /notifications/:id/read does NOT exist in backend.
// Use markAsRead with the single ID in the array instead.
export async function markSingleAsRead(notificationId: string): Promise<void> {
	await markAsRead([notificationId]);
}

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

export const notificationsApi = {
	async getNotifications(): Promise<LegacyApiResponse<Notification[]>> {
		try {
			const res = await getNotifications();
			return ok(res.items);
		} catch {
			return fail("Failed to load notifications");
		}
	},

	async markAsRead(notificationId: string): Promise<LegacyApiResponse<null>> {
		try {
			await markSingleAsRead(notificationId);
			return ok(null);
		} catch {
			return fail("Failed to mark notification as read");
		}
	},

	async markAllAsRead(): Promise<LegacyApiResponse<null>> {
		try {
			await markAsRead();
			return ok(null);
		} catch {
			return fail("Failed to mark all notifications as read");
		}
	},

	// Backend has no delete endpoint - always fails gracefully
	async deleteNotification(_notificationId: string): Promise<LegacyApiResponse<null>> {
		return fail("Delete notification is not supported by current backend API");
	},
};
