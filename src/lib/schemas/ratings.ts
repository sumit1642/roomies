import { z } from "zod";

const revieweeTypeEnum = z.enum(["user", "property"]);

export const submitRatingSchema = z.object({
	connectionId: z.string().uuid(),
	revieweeType: revieweeTypeEnum,
	revieweeId: z.string().uuid(),
	overallScore: z.number().min(1, "Rating is required").max(5),
	cleanlinessScore: z.number().min(1).max(5).optional(),
	communicationScore: z.number().min(1).max(5).optional(),
	reliabilityScore: z.number().min(1).max(5).optional(),
	valueScore: z.number().min(1).max(5).optional(),
	comment: z.string().max(1000).optional(),
});

export type SubmitRatingFormData = z.infer<typeof submitRatingSchema>;
