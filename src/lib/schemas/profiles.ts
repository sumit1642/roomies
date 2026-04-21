import { z } from "zod";

const genderEnum = z.enum(["male", "female", "other", "prefer_not_to_say"]);

export const updateStudentSchema = z.object({
	fullName: z.string().min(2).max(255).optional(),
	bio: z.string().max(1000).optional(),
	course: z.string().max(255).optional(),
	yearOfStudy: z.number().min(1).max(10).optional(),
	gender: genderEnum.optional(),
	dateOfBirth: z.string().optional(),
});

export type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;

export const updatePgOwnerSchema = z.object({
	businessName: z.string().min(2).max(255).optional(),
	ownerFullName: z.string().min(2).max(255).optional(),
	businessDescription: z.string().max(2000).optional(),
	businessPhone: z
		.string()
		.regex(/^[6-9]\d{9}$/, "Invalid phone number")
		.optional()
		.or(z.literal("")),
	operatingSince: z.number().min(1900).max(new Date().getFullYear()).optional(),
});

export type UpdatePgOwnerFormData = z.infer<typeof updatePgOwnerSchema>;

const documentTypeEnum = z.enum(["property_document", "rental_agreement", "owner_id", "trade_license"]);

export const submitDocumentSchema = z.object({
	documentType: documentTypeEnum,
	documentUrl: z.string().url("Must be a valid URL"),
});

export type SubmitDocumentFormData = z.infer<typeof submitDocumentSchema>;

export const updatePreferencesSchema = z.object({
	preferences: z.array(
		z.object({
			preferenceKey: z.string(),
			preferenceValue: z.string(),
		}),
	),
});

export type UpdatePreferencesFormData = z.infer<typeof updatePreferencesSchema>;
