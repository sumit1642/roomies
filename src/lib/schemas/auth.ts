import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Must be a valid email"),
	password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerStudentSchema = z.object({
	role: z.literal("student"),
	email: z.string().email("Must be a valid email"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Must contain a letter and a number"),
	fullName: z.string().min(2, "Name must be at least 2 characters").max(255),
});

export const registerPgOwnerSchema = z.object({
	role: z.literal("pg_owner"),
	email: z.string().email("Must be a valid email"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Must contain a letter and a number"),
	fullName: z.string().min(2, "Name must be at least 2 characters").max(255),
	businessName: z.string().min(2, "Business name must be at least 2 characters").max(255),
});

export const registerSchema = z.discriminatedUnion("role", [registerStudentSchema, registerPgOwnerSchema]);

export type RegisterFormData = z.infer<typeof registerSchema>;

export const otpVerifySchema = z.object({
	otp: z.string().regex(/^\d{6}$/, "Must be exactly 6 digits"),
});

export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;
