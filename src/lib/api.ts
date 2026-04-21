import type { ApiError } from "#/types";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
// const BASE = import.meta.env.VITE_API_BASE_URL || "https://roomies-api.onrender.com/api/v1";

export class ApiClientError extends Error {
	constructor(
		public status: number,
		public body: ApiError,
	) {
		super(body.message);
		this.name = "ApiClientError";
	}
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		credentials: "include", // always send cookies
		headers: { "Content-Type": "application/json", ...options?.headers },
		...options,
	});

	if (!res.ok) {
		const body = await res.json();
		throw new ApiClientError(res.status, body);
	}

	return res.json() as Promise<T>;
}
