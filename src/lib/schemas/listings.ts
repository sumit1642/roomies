import { z } from "zod";

const listingTypeEnum = z.enum(["student_room", "pg_room", "hostel_bed"]);
const roomTypeEnum = z.enum(["single", "double", "triple", "entire_flat"]);
const bedTypeEnum = z.enum(["single_bed", "double_bed", "bunk_bed"]);
const genderEnum = z.enum(["male", "female", "other", "prefer_not_to_say"]);

export const createListingSchema = z.object({
	propertyId: z.string().uuid().optional(),
	listingType: listingTypeEnum,
	title: z.string().min(5, "Title must be at least 5 characters").max(255),
	description: z.string().max(2000).optional(),
	rentPerMonth: z.number().min(500, "Rent must be at least 500").max(500000),
	depositAmount: z.number().min(0).max(1000000),
	rentIncludesUtilities: z.boolean().optional().default(false),
	isNegotiable: z.boolean().optional().default(false),
	roomType: roomTypeEnum,
	bedType: bedTypeEnum.optional(),
	totalCapacity: z.number().min(1).max(20),
	currentOccupants: z.number().min(0).optional().default(0),
	preferredGender: genderEnum.optional(),
	availableFrom: z.string().min(1, "Available from date is required"),
	availableUntil: z.string().optional(),
	addressLine: z.string().max(500).optional(),
	city: z.string().min(2, "City is required").max(100),
	locality: z.string().max(100).optional(),
	landmark: z.string().max(255).optional(),
	pincode: z
		.string()
		.regex(/^\d{6}$/, "Invalid pincode")
		.optional()
		.or(z.literal("")),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
	amenityIds: z.array(z.string().uuid()).optional(),
	preferences: z
		.array(
			z.object({
				preferenceKey: z.string(),
				preferenceValue: z.string(),
			}),
		)
		.optional(),
});

export type CreateListingFormData = z.infer<typeof createListingSchema>;

export const updateListingSchema = createListingSchema.partial();

export type UpdateListingFormData = z.infer<typeof updateListingSchema>;

export const listingStatusSchema = z.object({
	status: z.enum(["active", "filled", "deactivated"]),
});

export type ListingStatusFormData = z.infer<typeof listingStatusSchema>;

export const interestMessageSchema = z.object({
	message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
});

export type InterestMessageFormData = z.infer<typeof interestMessageSchema>;

// Legacy compatibility alias
export const listingSchema = createListingSchema;
