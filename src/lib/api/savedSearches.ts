// src/lib/api/savedSearches.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	SavedSearch,
	CreateSavedSearchInput,
	UpdateSavedSearchInput,
} from "#/types";

interface SavedSearchResponse {
	search_id: string;
	name: string;
	filters: Record<string, unknown>;
	last_alerted_at: string | null;
	created_at: string;
	updated_at?: string;
}

function normalizeSavedSearch(search: SavedSearchResponse): SavedSearch {
	return {
		searchId: search.search_id,
		name: search.name,
		filters: search.filters,
		lastAlertedAt: search.last_alerted_at,
		createdAt: search.created_at,
		updatedAt: search.updated_at,
	};
}

/**
 * GET /saved-searches
 * List all saved searches for the authenticated user.
 */
export async function listSavedSearches(): Promise<SavedSearch[]> {
	const res = await apiFetch<ApiSuccess<SavedSearchResponse[]>>("/saved-searches");
	return res.data.map(normalizeSavedSearch);
}

/**
 * POST /saved-searches
 * Create a new saved search.
 */
export async function createSavedSearch(data: CreateSavedSearchInput): Promise<SavedSearch> {
	const res = await apiFetch<ApiSuccess<SavedSearchResponse>>("/saved-searches", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return normalizeSavedSearch(res.data);
}

/**
 * PATCH /saved-searches/:searchId
 * Update name, filters, or alert preference for a saved search.
 */
export async function updateSavedSearch(searchId: string, data: UpdateSavedSearchInput): Promise<SavedSearch> {
	const res = await apiFetch<ApiSuccess<SavedSearchResponse>>(`/saved-searches/${searchId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
	return normalizeSavedSearch(res.data);
}

/**
 * DELETE /saved-searches/:searchId
 * Delete a saved search.
 */
export async function deleteSavedSearch(searchId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/saved-searches/${searchId}`, { method: "DELETE" });
}
