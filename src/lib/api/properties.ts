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
	LegacyApiResponse,
	LegacyProperty,
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

function toLegacyProperty(p: PropertyListItem | Property): LegacyProperty {
	return {
		id: p.property_id,
		name: p.property_name,
		address: p.address_line,
		city: p.city,
		state: "",
		pincode: p.pincode ?? "",
		description: p.description,
		is_verified: p.status === "active",
	};
}

function ok<T>(data?: T, message?: string): LegacyApiResponse<T> {
	return { success: true, data, message };
}

function fail<T>(message: string): LegacyApiResponse<T> {
	return { success: false, message };
}

export const propertiesApi = {
	async getMyProperties(): Promise<LegacyApiResponse<LegacyProperty[]>> {
		try {
			const res = await getMyProperties();
			return ok(res.items.map(toLegacyProperty));
		} catch {
			return fail("Failed to fetch properties");
		}
	},

	async createProperty(data: {
		name: string;
		address: string;
		city: string;
		state?: string;
		pincode: string;
		description?: string;
	}): Promise<LegacyApiResponse<LegacyProperty>> {
		try {
			const res = await createProperty({
				propertyName: data.name,
				addressLine: data.address,
				city: data.city,
				pincode: data.pincode,
				description: data.description,
				propertyType: "pg",
			});
			return ok(toLegacyProperty(res));
		} catch {
			return fail("Failed to create property");
		}
	},

	async updateProperty(
		propertyId: string,
		data: {
			name?: string;
			address?: string;
			city?: string;
			state?: string;
			pincode?: string;
			description?: string;
		},
	): Promise<LegacyApiResponse<LegacyProperty>> {
		try {
			const res = await updateProperty(propertyId, {
				propertyName: data.name,
				addressLine: data.address,
				city: data.city,
				pincode: data.pincode,
				description: data.description,
			});
			return ok(toLegacyProperty(res));
		} catch {
			return fail("Failed to update property");
		}
	},

	async deleteProperty(propertyId: string): Promise<LegacyApiResponse<null>> {
		try {
			await deleteProperty(propertyId);
			return ok(null);
		} catch {
			return fail("Failed to delete property");
		}
	},
};
