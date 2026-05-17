// src/lib/api/admin.ts
// Admin-only API functions for verification queue and report queue management.
// All endpoints require the 'admin' role + email verified (enforced by backend requireAdmin middleware).

import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	PaginatedResponse,
	VerificationQueueItem,
	AdminReportQueueItem,
	Cursor,
} from "#/types";

// ── Verification Queue ─────────────────────────────────────────────────────────

export async function getVerificationQueue(
	cursor?: Cursor,
): Promise<PaginatedResponse<VerificationQueueItem>> {
	const params = new URLSearchParams({ limit: "20" });
	if (cursor?.cursorTime) params.set("cursorTime", cursor.cursorTime);
	if (cursor?.cursorId) params.set("cursorId", cursor.cursorId);
	const res = await apiFetch<ApiSuccess<PaginatedResponse<VerificationQueueItem>>>(
		`/verification/queue?${params}`,
	);
	return res.data;
}

export async function approveVerification(
	requestId: string,
	adminNotes?: string,
): Promise<void> {
	await apiFetch<ApiMessage>(`/verification/${requestId}/approve`, {
		method: "PATCH",
		body: JSON.stringify({ adminNotes }),
	});
}

export async function rejectVerification(
	requestId: string,
	rejectionReason: string,
	adminNotes?: string,
): Promise<void> {
	await apiFetch<ApiMessage>(`/verification/${requestId}/reject`, {
		method: "PATCH",
		body: JSON.stringify({ rejectionReason, adminNotes }),
	});
}

// ── Report Queue ───────────────────────────────────────────────────────────────

export async function getReportQueue(
	cursor?: Cursor,
): Promise<PaginatedResponse<AdminReportQueueItem>> {
	const params = new URLSearchParams({ limit: "20" });
	if (cursor?.cursorTime) params.set("cursorTime", cursor.cursorTime);
	if (cursor?.cursorId) params.set("cursorId", cursor.cursorId);
	const res = await apiFetch<ApiSuccess<PaginatedResponse<AdminReportQueueItem>>>(
		`/reports/queue?${params}`,
	);
	return res.data;
}

export type ReportResolution = "resolved_kept" | "resolved_removed";

export async function resolveReport(
	reportId: string,
	resolution: ReportResolution,
	adminNotes?: string,
): Promise<void> {
	await apiFetch<ApiMessage>(`/reports/${reportId}/resolve`, {
		method: "PATCH",
		body: JSON.stringify({ resolution, adminNotes }),
	});
}
