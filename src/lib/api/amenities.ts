// src/lib/api/amenities.ts
import { apiFetch } from "../api";
import type { ApiSuccess, Amenity } from "#/types";

/**
 * GET /amenities — full catalog of amenities for picker components.
 * No auth required.
 */
export async function getAmenities(): Promise<Amenity[]> {
	const res = await apiFetch<ApiSuccess<{ items: Amenity[] }>>("/amenities");
	return res.data.items;
}
