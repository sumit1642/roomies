import { z } from "zod";

const propertyTypeEnum = z.enum(["pg", "hostel", "shared_apartment"]);

export const createPropertySchema = z.object({
	propertyName: z.string().min(3, "Property name must be at least 3 characters").max(255),
	description: z.string().max(2000).optional(),
	propertyType: propertyTypeEnum,
	addressLine: z.string().min(5, "Address is required").max(500),
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
	houseRules: z.string().max(2000).optional(),
	totalRooms: z.number().min(1).max(500).optional(),
	amenityIds: z.array(z.string().uuid()).optional(),
});

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial();

export type UpdatePropertyFormData = z.infer<typeof updatePropertySchema>;

// Legacy compatibility alias
export const propertySchema = createPropertySchema;
