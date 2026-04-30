// src/lib/api/rentIndex.ts
// Public endpoint — no auth required.
import { apiFetch } from "../api";
import type { ApiSuccess, RentIndexData, RentIndexParams } from "#/types";

/**
 * GET /rent-index?city=&locality=&roomType=
 * Returns rent percentile data (p25/p50/p75) for a given city + locality + room type.
 * Public — no authentication needed.
 * Returns null when there is insufficient data for the combination.
 */
export async function getRentIndex(params: RentIndexParams): Promise<RentIndexData | null> {
	const searchParams = new URLSearchParams({
		city: params.city,
		locality: params.locality,
		roomType: params.roomType,
	});
	try {
		const res = await apiFetch<ApiSuccess<RentIndexData>>(`/rent-index?${searchParams.toString()}`);
		return res.data;
	} catch {
		// 404 / no data → return null so callers can handle gracefully
		return null;
	}
}
