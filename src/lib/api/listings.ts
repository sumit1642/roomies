import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	PaginatedResponse,
	ListingSearchItem,
	ListingDetail,
	ListingPhoto,
	SavedListingItem,
	Cursor,
	ListingType,
	RoomType,
	Gender,
	ListingStatus,
	BedType,
	PreferencePair,
} from "#/types";

export interface ListingSearchParams {
	city?: string;
	listingType?: ListingType;
	minRent?: number;
	maxRent?: number;
	roomType?: RoomType;
	bedType?: BedType;
	preferredGender?: Gender;
	availableFrom?: string;
	amenityIds?: string[];
	sortBy?: "recent" | "compatibility";
	lat?: number;
	lng?: number;
	radius?: number;
	cursorTime?: string;
	cursorId?: string;
	limit?: number;
}

export async function searchListings(params: ListingSearchParams): Promise<PaginatedResponse<ListingSearchItem>> {
	const searchParams = new URLSearchParams();

	if (params.city) searchParams.set("city", params.city);
	if (params.listingType) searchParams.set("listingType", params.listingType);
	if (params.minRent !== undefined) searchParams.set("minRent", String(params.minRent));
	if (params.maxRent !== undefined) searchParams.set("maxRent", String(params.maxRent));
	if (params.roomType) searchParams.set("roomType", params.roomType);
	if (params.bedType) searchParams.set("bedType", params.bedType);
	if (params.preferredGender) searchParams.set("preferredGender", params.preferredGender);
	if (params.availableFrom) searchParams.set("availableFrom", params.availableFrom);
	if (params.amenityIds?.length) searchParams.set("amenityIds", params.amenityIds.join(","));
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);
	if (params.lat !== undefined) searchParams.set("lat", String(params.lat));
	if (params.lng !== undefined) searchParams.set("lng", String(params.lng));
	if (params.radius !== undefined) searchParams.set("radius", String(params.radius));
	if (params.cursorTime) searchParams.set("cursorTime", params.cursorTime);
	if (params.cursorId) searchParams.set("cursorId", params.cursorId);
	if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<ListingSearchItem>>>(
		`/listings${query ? `?${query}` : ""}`,
	);
	return res.data;
}

export async function getListing(listingId: string): Promise<ListingDetail> {
	const res = await apiFetch<ApiSuccess<ListingDetail>>(`/listings/${listingId}`);
	return res.data;
}

export interface CreateListingInput {
	propertyId?: string;
	listingType: ListingType;
	title: string;
	description?: string;
	rentPerMonth: number;
	depositAmount: number;
	rentIncludesUtilities?: boolean;
	isNegotiable?: boolean;
	roomType: RoomType;
	bedType?: BedType;
	totalCapacity: number;
	currentOccupants?: number;
	preferredGender?: Gender;
	availableFrom: string;
	availableUntil?: string;
	addressLine?: string;
	city: string;
	locality?: string;
	landmark?: string;
	pincode?: string;
	latitude?: number;
	longitude?: number;
	amenityIds?: string[];
	preferences?: { preferenceKey: string; preferenceValue: string }[];
}

export async function createListing(data: CreateListingInput): Promise<ListingDetail> {
	const res = await apiFetch<ApiSuccess<ListingDetail>>("/listings", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return res.data;
}

export async function updateListing(listingId: string, data: Partial<CreateListingInput>): Promise<ListingDetail> {
	const res = await apiFetch<ApiSuccess<ListingDetail>>(`/listings/${listingId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

export async function updateListingStatus(listingId: string, status: ListingStatus): Promise<ListingDetail> {
	const res = await apiFetch<ApiSuccess<ListingDetail>>(`/listings/${listingId}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
	return res.data;
}

export async function renewListing(listingId: string): Promise<{
	listingId: string;
	status: string;
	expiresAt: string;
	renewedFor: string;
}> {
	const res = await apiFetch<
		ApiSuccess<{ listingId: string; status: string; expiresAt: string; renewedFor: string }>
	>(`/listings/${listingId}/renew`, { method: "POST" });
	return res.data;
}

export async function getListingAnalytics(listingId: string): Promise<{
	listingId: string;
	title: string;
	status: string;
	createdAt: string;
	expiresAt: string | null;
	views: number;
	interests: {
		total: number;
		pending: number;
		accepted: number;
		declined: number;
		withdrawn: number;
		expired: number;
	};
	conversionRate: number | null;
}> {
	const res = await apiFetch<
		ApiSuccess<{
			listingId: string;
			title: string;
			status: string;
			createdAt: string;
			expiresAt: string | null;
			views: number;
			interests: {
				total: number;
				pending: number;
				accepted: number;
				declined: number;
				withdrawn: number;
				expired: number;
			};
			conversionRate: number | null;
		}>
	>(`/listings/${listingId}/analytics`);
	return res.data;
}

export async function deleteListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}`, { method: "DELETE" });
}

export async function getListingPhotos(listingId: string): Promise<ListingPhoto[]> {
	const res = await apiFetch<ApiSuccess<ListingPhoto[]>>(`/listings/${listingId}/photos`);
	return res.data;
}

export interface PhotoUploadResult {
	photoId: string;
	status: "processing";
}

export async function uploadListingPhoto(listingId: string, formData: FormData): Promise<PhotoUploadResult> {
	const res = await apiFetch<ApiSuccess<PhotoUploadResult>>(`/listings/${listingId}/photos`, {
		method: "POST",
		body: formData,
	});
	return res.data;
}

export async function deleteListingPhoto(listingId: string, photoId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/photos/${photoId}`, { method: "DELETE" });
}

export async function setCoverPhoto(listingId: string, photoId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/photos/${photoId}/cover`, { method: "PATCH" });
}

export async function reorderPhotos(
	listingId: string,
	photos: { photoId: string; displayOrder: number }[],
): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/photos/reorder`, {
		method: "PUT",
		body: JSON.stringify({ photos }),
	});
}

export async function getSavedListings(cursor?: Cursor): Promise<PaginatedResponse<SavedListingItem>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<SavedListingItem>>>(
		`/listings/me/saved${query ? `?${query}` : ""}`,
	);
	return res.data;
}

export async function getSavedListingIds(): Promise<Set<string>> {
	const res = await getSavedListings();
	return new Set(res.items.map((l) => l.listing_id));
}

export async function saveListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/save`, { method: "POST" });
}

export async function unsaveListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/save`, { method: "DELETE" });
}

export async function getListingPreferences(listingId: string): Promise<PreferencePair[]> {
	const res = await apiFetch<ApiSuccess<PreferencePair[]>>(`/listings/${listingId}/preferences`);
	return res.data;
}

export async function updateListingPreferences(
	listingId: string,
	preferences: PreferencePair[],
): Promise<PreferencePair[]> {
	const res = await apiFetch<ApiSuccess<PreferencePair[]>>(`/listings/${listingId}/preferences`, {
		method: "PUT",
		body: JSON.stringify({ preferences }),
	});
	return res.data;
}
