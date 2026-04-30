// src/lib/api/savedSearches.ts
// NOTE: Backend savedSearchRouter exists (src/routes/savedSearch.js) but is NOT
// currently mounted in src/routes/index.js. These calls will fail until the
// backend mounts it at /saved-searches.
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	SavedSearch,
	CreateSavedSearchInput,
	UpdateSavedSearchInput,
} from "#/types";

/**
 * GET /saved-searches
 * List all saved searches for the authenticated user.
 */
export async function listSavedSearches(): Promise<SavedSearch[]> {
	const res = await apiFetch<ApiSuccess<SavedSearch[]>>("/saved-searches");
	return res.data;
}

/**
 * POST /saved-searches
 * Create a new saved search.
 */
export async function createSavedSearch(data: CreateSavedSearchInput): Promise<SavedSearch> {
	const res = await apiFetch<ApiSuccess<SavedSearch>>("/saved-searches", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return res.data;
}

/**
 * PATCH /saved-searches/:searchId
 * Update name, filters, or alert preference for a saved search.
 */
export async function updateSavedSearch(searchId: string, data: UpdateSavedSearchInput): Promise<SavedSearch> {
	const res = await apiFetch<ApiSuccess<SavedSearch>>(`/saved-searches/${searchId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
	return res.data;
}

/**
 * DELETE /saved-searches/:searchId
 * Delete a saved search.
 */
export async function deleteSavedSearch(searchId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/saved-searches/${searchId}`, { method: "DELETE" });
}
