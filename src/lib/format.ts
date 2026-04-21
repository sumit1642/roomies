/**
 * Format a number as Indian Rupees currency
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
	const now = new Date();
	const then = new Date(date);
	const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return "just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
	}

	const diffInWeeks = Math.floor(diffInDays / 7);
	if (diffInWeeks < 4) {
		return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
	}

	return then.toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/**
 * Format a date as a short date string
 */
export function formatDate(date: string | Date): string {
	return new Date(date).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/**
 * Format room type for display
 */
export function formatRoomType(roomType: string): string {
	const types: Record<string, string> = {
		single: "Single Room",
		double: "Double Sharing",
		triple: "Triple Sharing",
		entire_flat: "Entire Flat",
	};
	return types[roomType] || roomType;
}

/**
 * Format listing type for display
 */
export function formatListingType(listingType: string): string {
	const types: Record<string, string> = {
		student_room: "Student Room",
		pg_room: "PG Room",
		hostel_bed: "Hostel Bed",
	};
	return types[listingType] || listingType;
}

/**
 * Format gender for display
 */
export function formatGender(gender: string | null): string {
	if (!gender) return "Any Gender";
	const genders: Record<string, string> = {
		male: "Male",
		female: "Female",
		other: "Other",
		prefer_not_to_say: "Any",
	};
	return genders[gender] || gender;
}
