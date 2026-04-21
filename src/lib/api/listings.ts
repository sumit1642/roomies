// src/lib/api/listings.ts
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
	Listing,
	ListingFilters,
	LegacyApiResponse,
} from "#/types";

export interface ListingSearchParams {
	city?: string;
	listingType?: ListingType;
	minRent?: number;
	maxRent?: number;
	roomType?: RoomType;
	preferredGender?: Gender;
	availableFrom?: string;
	amenityIds?: string[];
	lat?: number;
	lng?: number;
	// FIX: was radiusKm, backend expects radius in meters
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
	if (params.preferredGender) searchParams.set("preferredGender", params.preferredGender);
	if (params.availableFrom) searchParams.set("availableFrom", params.availableFrom);
	if (params.amenityIds?.length) searchParams.set("amenityIds", params.amenityIds.join(","));
	if (params.lat !== undefined) searchParams.set("lat", String(params.lat));
	if (params.lng !== undefined) searchParams.set("lng", String(params.lng));
	// FIX: backend param name is "radius" in meters (min 100, max 50000)
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

export async function deleteListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}`, { method: "DELETE" });
}

// Photos
export async function getListingPhotos(listingId: string): Promise<ListingPhoto[]> {
	const res = await apiFetch<ApiSuccess<ListingPhoto[]>>(`/listings/${listingId}/photos`);
	return res.data;
}

export async function uploadListingPhoto(listingId: string, formData: FormData): Promise<ListingPhoto> {
	const res = await fetch(
		`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"}/listings/${listingId}/photos`,
		// `${import.meta.env.VITE_API_BASE_URL || "https://roomies-api.onrender.com/api/v1"}/listings/${listingId}/photos`,
		{
			method: "POST",
			credentials: "include",
			body: formData,
		},
	);
	if (!res.ok) {
		const body = await res.json();
		throw new Error(body.message || "Failed to upload photo");
	}
	const json = (await res.json()) as ApiSuccess<ListingPhoto>;
	return json.data;
}

export async function deleteListingPhoto(listingId: string, photoId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/photos/${photoId}`, { method: "DELETE" });
}

// FIX: was PUT, backend expects PATCH
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

// Saved listings
// FIX: was /saved-listings, backend expects /listings/me/saved
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

// FIX: was /saved-listings/${listingId}, backend expects POST /listings/${listingId}/save
export async function saveListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/save`, { method: "POST" });
}

// FIX: was /saved-listings/${listingId}, backend expects DELETE /listings/${listingId}/save
export async function unsaveListing(listingId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/listings/${listingId}/save`, { method: "DELETE" });
}

function toLegacyListingFromSearch(item: ListingSearchItem): Listing {
	return {
		id: item.listingId,
		title: item.title,
		room_type: item.roomType,
		gender_preference: item.preferredGender ?? "prefer_not_to_say",
		rent_amount: item.rentPerMonth,
		deposit_amount: item.depositAmount,
		available_from: item.availableFrom,
		status: item.status,
		property: {
			name: "Property",
			city: item.city,
		},
	};
}

function toLegacyListingFromDetail(item: ListingDetail): Listing {
	return {
		id: item.listingId,
		title: item.title,
		description: item.description,
		property_id: item.propertyId ?? undefined,
		room_type: item.roomType,
		gender_preference: item.preferredGender ?? "prefer_not_to_say",
		rent_amount: item.rentPerMonth,
		deposit_amount: item.depositAmount,
		available_from: item.availableFrom,
		amenities: item.amenities.map((a) => a.name),
		status: item.status,
		property:
			item.property ?
				{
					id: item.property.property_id,
					name: item.property.property_name,
					city: item.property.city,
					address: item.property.address_line,
					pincode: item.property.pincode ?? undefined,
					rating: item.property.average_rating,
					rating_count: item.property.rating_count,
				}
			:	undefined,
		owner: {
			name: item.poster_name,
		},
	};
}

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

export const listingsApi = {
	async browseListings(
		params: ListingFilters & { page?: number; limit?: number },
	): Promise<LegacyApiResponse<Listing[]>> {
		try {
			const res = await searchListings({
				city: params.city,
				roomType: params.room_type,
				minRent: params.min_rent,
				maxRent: params.max_rent,
				preferredGender: params.gender_preference,
				limit: params.limit,
			});
			return ok(res.items.map(toLegacyListingFromSearch));
		} catch {
			return fail("Failed to browse listings");
		}
	},

	async getMyListings(): Promise<LegacyApiResponse<Listing[]>> {
		try {
			const res = await searchListings({ limit: 100 });
			return ok(res.items.map(toLegacyListingFromSearch));
		} catch {
			return fail("Failed to fetch listings");
		}
	},

	async getListingById(listingId: string): Promise<LegacyApiResponse<Listing>> {
		try {
			const res = await getListing(listingId);
			return ok(toLegacyListingFromDetail(res));
		} catch {
			return fail("Listing not found");
		}
	},

	async createListing(data: CreateListingInput): Promise<LegacyApiResponse<Listing>> {
		try {
			const res = await createListing(data);
			return ok(toLegacyListingFromDetail(res));
		} catch {
			return fail("Failed to create listing");
		}
	},

	async updateListing(listingId: string, data: Partial<CreateListingInput> & { status?: string }) {
		try {
			if (data.status) {
				const status = data.status === "inactive" ? "deactivated" : data.status;
				const res = await updateListingStatus(listingId, status as ListingStatus);
				return ok(toLegacyListingFromDetail(res));
			}
			const res = await updateListing(listingId, data);
			return ok(toLegacyListingFromDetail(res));
		} catch {
			return fail("Failed to update listing");
		}
	},

	async deleteListing(listingId: string): Promise<LegacyApiResponse<null>> {
		try {
			await deleteListing(listingId);
			return ok(null);
		} catch {
			return fail("Failed to delete listing");
		}
	},

	async saveListing(listingId: string): Promise<LegacyApiResponse<null>> {
		try {
			await saveListing(listingId);
			return ok(null);
		} catch {
			return fail("Failed to save listing");
		}
	},

	async unsaveListing(listingId: string): Promise<LegacyApiResponse<null>> {
		try {
			await unsaveListing(listingId);
			return ok(null);
		} catch {
			return fail("Failed to unsave listing");
		}
	},
};
