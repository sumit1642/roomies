// src/routes/register.tsx
import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Home, Loader2, GraduationCap, Building2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { toast } from "#/components/ui/sonner";
import { useAuth } from "#/context/AuthContext";
import { register } from "#/lib/api/auth";
import { registerStudentSchema, registerPgOwnerSchema, type RegisterFormData } from "#/lib/schemas/auth";
import { ApiClientError } from "#/lib/api";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
	head: () => ({
		meta: [{ title: "Create Account - Roomies" }],
	}),
});

interface StudentFormData {
	email: string;
	password: string;
	fullName: string;
}

interface PgOwnerFormData {
	email: string;
	password: string;
	fullName: string;
	businessName: string;
}

function RegisterPage() {
	const navigate = useNavigate();
	const { user, isLoading, login: setAuth } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [selectedRole, setSelectedRole] = useState<"student" | "pg_owner">("student");

	const [studentForm, setStudentForm] = useState<StudentFormData>({
		email: "",
		password: "",
		fullName: "",
	});

	const [pgOwnerForm, setPgOwnerForm] = useState<PgOwnerFormData>({
		email: "",
		password: "",
		fullName: "",
		businessName: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [apiError, setApiError] = useState<string | null>(null);

	// FIX: was calling navigate() during render. Use useEffect instead.
	useEffect(() => {
		if (!isLoading && user) {
			navigate({ to: "/dashboard" });
		}
	}, [user, isLoading, navigate]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-pulse text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (user) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});
		setApiError(null);

		const formData: RegisterFormData =
			selectedRole === "student" ? { role: "student", ...studentForm } : { role: "pg_owner", ...pgOwnerForm };

		const schema = selectedRole === "student" ? registerStudentSchema : registerPgOwnerSchema;
		const result = schema.safeParse(formData);

		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const field = issue.path[0] as string;
				fieldErrors[field] = issue.message;
			}
			setErrors(fieldErrors);
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await register(formData);
			setAuth(response);
			toast.success("Account created successfully!", {
				description: "Welcome to Roomies!",
			});
			navigate({ to: "/dashboard" });
		} catch (error) {
			if (error instanceof ApiClientError) {
				if (error.status === 409) {
					setApiError("An account with this email already exists");
				} else if (error.body.errors) {
					const fieldErrors: Record<string, string> = {};
					for (const err of error.body.errors) {
						const field = err.field.replace("body.", "");
						fieldErrors[field] = err.message;
					}
					setErrors(fieldErrors);
				} else {
					setApiError(error.body.message || "Something went wrong");
				}
			} else {
				setApiError("Network error, please try again");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignIn = () => {
		toast.info("Google Sign-In coming soon", {
			description: "We're working on adding Google authentication",
		});
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="border-b border-border/40 bg-(--header-bg)">
				<div className="mx-auto flex h-16 max-w-6xl items-center px-4">
					<Link
						to="/"
						className="flex items-center gap-2">
						<div className="flex size-9 items-center justify-center rounded-lg bg-(--lagoon) text-white">
							<Home className="size-5" />
						</div>
						<span className="text-xl font-bold text-(--sea-ink)">Roomies</span>
					</Link>
				</div>
			</header>

			{/* Main */}
			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Create Account</CardTitle>
						<CardDescription>Join Roomies to find your perfect accommodation</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs
							value={selectedRole}
							onValueChange={(value) => setSelectedRole(value as "student" | "pg_owner")}
							className="mb-6">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger
									value="student"
									className="gap-2">
									<GraduationCap className="size-4" />
									Student
								</TabsTrigger>
								<TabsTrigger
									value="pg_owner"
									className="gap-2">
									<Building2 className="size-4" />
									PG Owner
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<form
							onSubmit={handleSubmit}
							className="space-y-4">
							{apiError && (
								<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
									{apiError}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									type="text"
									placeholder="Enter your full name"
									value={selectedRole === "student" ? studentForm.fullName : pgOwnerForm.fullName}
									onChange={(e) => {
										if (selectedRole === "student") {
											setStudentForm({ ...studentForm, fullName: e.target.value });
										} else {
											setPgOwnerForm({ ...pgOwnerForm, fullName: e.target.value });
										}
									}}
									disabled={isSubmitting}
								/>
								{errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
							</div>

							{selectedRole === "pg_owner" && (
								<div className="space-y-2">
									<Label htmlFor="businessName">Business Name</Label>
									<Input
										id="businessName"
										type="text"
										placeholder="Enter your PG/hostel name"
										value={pgOwnerForm.businessName}
										onChange={(e) =>
											setPgOwnerForm({ ...pgOwnerForm, businessName: e.target.value })
										}
										disabled={isSubmitting}
									/>
									{errors.businessName && (
										<p className="text-sm text-destructive">{errors.businessName}</p>
									)}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@example.com"
									value={selectedRole === "student" ? studentForm.email : pgOwnerForm.email}
									onChange={(e) => {
										if (selectedRole === "student") {
											setStudentForm({ ...studentForm, email: e.target.value });
										} else {
											setPgOwnerForm({ ...pgOwnerForm, email: e.target.value });
										}
									}}
									disabled={isSubmitting}
								/>
								{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Min 8 chars, letter & number"
										value={selectedRole === "student" ? studentForm.password : pgOwnerForm.password}
										onChange={(e) => {
											if (selectedRole === "student") {
												setStudentForm({ ...studentForm, password: e.target.value });
											} else {
												setPgOwnerForm({ ...pgOwnerForm, password: e.target.value });
											}
										}}
										disabled={isSubmitting}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
										{showPassword ?
											<EyeOff className="size-4" />
										:	<Eye className="size-4" />}
									</button>
								</div>
								{errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting}>
								{isSubmitting ?
									<>
										<Loader2 className="size-4 animate-spin" />
										Creating account...
									</>
								:	"Create Account"}
							</Button>
						</form>

						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-2 text-muted-foreground">Or continue with</span>
							</div>
						</div>

						<Button
							variant="outline"
							className="w-full"
							onClick={handleGoogleSignIn}
							disabled={isSubmitting}>
							<svg
								className="size-4"
								viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</Button>
					</CardContent>
					<CardFooter className="justify-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/login"
								className="font-medium text-primary hover:underline">
								Sign in
							</Link>
						</p>
					</CardFooter>
				</Card>
			</main>
		</div>
	);
}
