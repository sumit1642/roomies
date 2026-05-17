// src/lib/api/properties.ts
import { apiFetch } from "../api";
import type {
	ApiSuccess,
	ApiMessage,
	PaginatedResponse,
	Property,
	PropertyListItem,
	Cursor,
	PropertyType,
} from "#/types";

export async function getMyProperties(cursor?: Cursor): Promise<PaginatedResponse<PropertyListItem>> {
	const searchParams = new URLSearchParams();
	if (cursor) {
		searchParams.set("cursorTime", cursor.cursorTime);
		searchParams.set("cursorId", cursor.cursorId);
	}
	const query = searchParams.toString();
	const res = await apiFetch<ApiSuccess<PaginatedResponse<PropertyListItem>>>(
		`/properties${query ? `?${query}` : ""}`,
	);
	return res.data;
}

export async function getProperty(propertyId: string): Promise<Property> {
	const res = await apiFetch<ApiSuccess<Property>>(`/properties/${propertyId}`);
	return res.data;
}

export interface CreatePropertyInput {
	propertyName: string;
	description?: string;
	propertyType: PropertyType;
	addressLine: string;
	city: string;
	locality?: string;
	landmark?: string;
	pincode?: string;
	latitude?: number;
	longitude?: number;
	houseRules?: string;
	totalRooms?: number;
	amenityIds?: string[];
}

export async function createProperty(data: CreatePropertyInput): Promise<Property> {
	const res = await apiFetch<ApiSuccess<Property>>("/properties", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return res.data;
}

export async function updateProperty(propertyId: string, data: Partial<CreatePropertyInput>): Promise<Property> {
	const res = await apiFetch<ApiSuccess<Property>>(`/properties/${propertyId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
	return res.data;
}

export async function deleteProperty(propertyId: string): Promise<void> {
	await apiFetch<ApiMessage>(`/properties/${propertyId}`, { method: "DELETE" });
}
