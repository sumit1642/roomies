// src/routes/_auth/profile.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle, Clock, AlertCircle, Trash2, Camera, Pencil, X, Save } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { toast } from "#/components/ui/sonner";
import { useAuth } from "#/context/AuthContext";
import { StarRating } from "#/components/StarRating";
import { OtpInput } from "#/components/OtpInput";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import {
	getStudentProfile,
	updateStudentProfile,
	getPgOwnerProfile,
	updatePgOwnerProfile,
	submitVerificationDocument,
} from "#/lib/api/profiles";
import { getSessions, revokeSession, logoutAll, sendOtp, verifyOtp } from "#/lib/api/auth";
import { ApiClientError } from "#/lib/api";
import type { StudentProfile, PgOwnerProfile, SessionItem, DocumentType } from "#/types";

export const Route = createFileRoute("/_auth/profile")({
	component: ProfilePage,
	head: () => ({
		meta: [{ title: "Profile - Roomies" }],
	}),
});

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfilePage() {
	const { user, role, refreshUser } = useAuth();

	if (!user?.userId) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (role === "pg_owner") {
		return (
			<PgOwnerProfilePage
				userId={user.userId}
				refreshUser={refreshUser}
			/>
		);
	}

	return (
		<StudentProfilePage
			userId={user.userId}
			refreshUser={refreshUser}
		/>
	);
}

// ─── Photo Avatar with Edit Overlay ──────────────────────────────────────────
function ProfilePhotoEditor({
	name,
	photoUrl,
	onPhotoChange,
}: {
	name: string;
	photoUrl?: string | null;
	onPhotoChange?: (file: File) => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && onPhotoChange) {
			onPhotoChange(file);
		}
	};

	return (
		<div className="relative group inline-block">
			<Avatar className="size-20 ring-2 ring-border">
				{photoUrl && (
					<AvatarImage
						src={photoUrl}
						alt={name}
					/>
				)}
				<AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
					{getInitials(name)}
				</AvatarFallback>
			</Avatar>

			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
				title="Change profile photo">
				<Camera className="size-5 text-white" />
			</button>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>

			<div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md pointer-events-none">
				<Pencil className="size-3" />
			</div>
		</div>
	);
}

// ─── Student Profile Page ─────────────────────────────────────────────────────
function StudentProfilePage({ userId, refreshUser }: { userId: string; refreshUser: () => Promise<void> }) {
	const { isEmailVerified } = useAuth();
	const [profile, setProfile] = useState<StudentProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [sessions, setSessions] = useState<SessionItem[]>([]);

	const [formData, setFormData] = useState({
		fullName: "",
		bio: "",
		course: "",
		yearOfStudy: "",
		gender: "",
		dateOfBirth: "",
	});

	useEffect(() => {
		if (!userId) return;
		async function fetchData() {
			try {
				const [profileData, sessionsData] = await Promise.all([getStudentProfile(userId), getSessions()]);
				setProfile(profileData);
				setSessions(sessionsData);
				setFormData({
					fullName: profileData.full_name || "",
					bio: profileData.bio || "",
					course: profileData.course || "",
					yearOfStudy: profileData.year_of_study?.toString() || "",
					gender: profileData.gender || "",
					dateOfBirth: profileData.date_of_birth || "",
				});
			} catch {
				toast.error("Failed to load profile");
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [userId]);

	const handleCancelEdit = () => {
		if (profile) {
			setFormData({
				fullName: profile.full_name || "",
				bio: profile.bio || "",
				course: profile.course || "",
				yearOfStudy: profile.year_of_study?.toString() || "",
				gender: profile.gender || "",
				dateOfBirth: profile.date_of_birth || "",
			});
		}
		setIsEditing(false);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const updated = await updateStudentProfile(userId, {
				fullName: formData.fullName || undefined,
				bio: formData.bio || undefined,
				course: formData.course || undefined,
				yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
				gender: (formData.gender as StudentProfile["gender"]) || undefined,
				dateOfBirth: formData.dateOfBirth || undefined,
			});
			setProfile(updated);
			toast.success("Profile updated successfully");
			setIsEditing(false);
		} catch {
			toast.error("Failed to update profile");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const displayName = profile?.full_name || "Student";

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">Profile</h1>

			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex items-start gap-6">
						<ProfilePhotoEditor
							name={displayName}
							photoUrl={profile?.profile_photo_url}
							onPhotoChange={() => {
								toast.info("Photo upload coming soon");
							}}
						/>

						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div>
									<h2 className="text-xl font-semibold">{displayName}</h2>
									{profile?.email && <p className="text-muted-foreground text-sm">{profile.email}</p>}
									{profile?.course && (
										<p className="text-sm text-muted-foreground mt-0.5">
											{profile.course}
											{profile.year_of_study && ` · Year ${profile.year_of_study}`}
										</p>
									)}
								</div>
								{!isEditing ?
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditing(true)}>
										<Pencil className="size-3.5 mr-1.5" />
										Edit Profile
									</Button>
								:	<Button
										variant="ghost"
										size="sm"
										onClick={handleCancelEdit}>
										<X className="size-3.5 mr-1.5" />
										Cancel
									</Button>
								}
							</div>

							{profile?.bio && !isEditing && (
								<p className="mt-2 text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
							)}

							<div className="mt-3 flex items-center gap-2">
								<StarRating
									rating={profile?.average_rating || 0}
									size="sm"
								/>
								<span className="text-sm text-muted-foreground">
									({profile?.rating_count || 0} reviews)
								</span>
								{profile?.is_aadhaar_verified && (
									<Badge
										variant="success"
										className="text-xs">
										<CheckCircle className="size-3 mr-1" />
										Aadhaar Verified
									</Badge>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{isEditing && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Edit Personal Information</CardTitle>
						<CardDescription>Update your profile details, then click Save Changes</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									value={formData.fullName}
									onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
									placeholder="Your full name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="gender">Gender</Label>
								<Select
									value={formData.gender}
									onValueChange={(value) => setFormData({ ...formData, gender: value })}>
									<SelectTrigger>
										<SelectValue placeholder="Select gender" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="male">Male</SelectItem>
										<SelectItem value="female">Female</SelectItem>
										<SelectItem value="other">Other</SelectItem>
										<SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="course">Course</Label>
								<Input
									id="course"
									placeholder="e.g., B.Tech Computer Science"
									value={formData.course}
									onChange={(e) => setFormData({ ...formData, course: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="yearOfStudy">Year of Study</Label>
								<Select
									value={formData.yearOfStudy}
									onValueChange={(value) => setFormData({ ...formData, yearOfStudy: value })}>
									<SelectTrigger>
										<SelectValue placeholder="Select year" />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5, 6].map((year) => (
											<SelectItem
												key={year}
												value={year.toString()}>
												Year {year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dateOfBirth">Date of Birth</Label>
							<Input
								id="dateOfBirth"
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bio">Bio</Label>
							<Textarea
								id="bio"
								placeholder="Tell us about yourself, your habits, what you're looking for..."
								value={formData.bio}
								onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								rows={4}
							/>
						</div>

						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={handleCancelEdit}
								disabled={isSaving}>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving}>
								{isSaving ?
									<>
										<Loader2 className="size-4 animate-spin mr-2" />
										Saving...
									</>
								:	<>
										<Save className="size-4 mr-2" />
										Save Changes
									</>
								}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{!isEditing && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-3">
							<InfoRow
								label="Full Name"
								value={profile?.full_name}
							/>
							<InfoRow
								label="Gender"
								value={formatGenderDisplay(profile?.gender)}
							/>
							<InfoRow
								label="Course"
								value={profile?.course}
							/>
							<InfoRow
								label="Year of Study"
								value={profile?.year_of_study ? `Year ${profile.year_of_study}` : undefined}
							/>
							<InfoRow
								label="Date of Birth"
								value={
									profile?.date_of_birth ?
										new Date(profile.date_of_birth).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})
									:	undefined
								}
							/>
							<InfoRow
								label="Bio"
								value={profile?.bio}
							/>
						</dl>
					</CardContent>
				</Card>
			)}

			<EmailVerificationSection
				isVerified={isEmailVerified}
				refreshUser={refreshUser}
			/>

			<SessionsSection
				sessions={sessions}
				onSessionsChange={setSessions}
			/>
		</div>
	);
}

// ─── PG Owner Profile Page ────────────────────────────────────────────────────
function PgOwnerProfilePage({ userId, refreshUser }: { userId: string; refreshUser: () => Promise<void> }) {
	const { isEmailVerified } = useAuth();
	const [profile, setProfile] = useState<PgOwnerProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [sessions, setSessions] = useState<SessionItem[]>([]);

	const [formData, setFormData] = useState({
		businessName: "",
		ownerFullName: "",
		businessDescription: "",
		businessPhone: "",
		operatingSince: "",
	});

	const [documentForm, setDocumentForm] = useState({
		documentType: "" as DocumentType | "",
		documentUrl: "",
	});
	const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

	useEffect(() => {
		if (!userId) return;
		async function fetchData() {
			try {
				const [profileData, sessionsData] = await Promise.all([getPgOwnerProfile(userId), getSessions()]);
				setProfile(profileData);
				setSessions(sessionsData);
				setFormData({
					businessName: profileData.business_name || "",
					ownerFullName: profileData.owner_full_name || "",
					businessDescription: profileData.business_description || "",
					businessPhone: profileData.business_phone || "",
					operatingSince: profileData.operating_since?.toString() || "",
				});
			} catch {
				toast.error("Failed to load profile");
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [userId]);

	const handleCancelEdit = () => {
		if (profile) {
			setFormData({
				businessName: profile.business_name || "",
				ownerFullName: profile.owner_full_name || "",
				businessDescription: profile.business_description || "",
				businessPhone: profile.business_phone || "",
				operatingSince: profile.operating_since?.toString() || "",
			});
		}
		setIsEditing(false);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const updated = await updatePgOwnerProfile(userId, {
				businessName: formData.businessName || undefined,
				ownerFullName: formData.ownerFullName || undefined,
				businessDescription: formData.businessDescription || undefined,
				businessPhone: formData.businessPhone || undefined,
				operatingSince: formData.operatingSince ? parseInt(formData.operatingSince) : undefined,
			});
			setProfile(updated);
			toast.success("Profile updated successfully");
			setIsEditing(false);
		} catch {
			toast.error("Failed to update profile");
		} finally {
			setIsSaving(false);
		}
	};

	const handleSubmitDocument = async () => {
		if (!documentForm.documentType || !documentForm.documentUrl) {
			toast.error("Please fill in all fields");
			return;
		}
		setIsSubmittingDoc(true);
		try {
			await submitVerificationDocument(userId, {
				documentType: documentForm.documentType as DocumentType,
				documentUrl: documentForm.documentUrl,
			});
			toast.success("Document submitted for verification");
			setDocumentForm({ documentType: "", documentUrl: "" });
			const updatedProfile = await getPgOwnerProfile(userId);
			setProfile(updatedProfile);
		} catch (error) {
			if (error instanceof ApiClientError && error.status === 409) {
				toast.error("You already have a pending verification request");
			} else {
				toast.error("Failed to submit document");
			}
		} finally {
			setIsSubmittingDoc(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const displayName = profile?.owner_full_name || "Owner";
	// Use profile_photo_url if the backend ever returns it (migration 003 added the column)
	const photoUrl =
		(profile as (PgOwnerProfile & { profile_photo_url?: string | null }) | null)?.profile_photo_url ?? null;

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">Profile</h1>

			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex items-start gap-6">
						<ProfilePhotoEditor
							name={displayName}
							photoUrl={photoUrl}
							onPhotoChange={() => {
								toast.info("Photo upload coming soon");
							}}
						/>

						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div>
									<div className="flex items-center gap-2 flex-wrap">
										<h2 className="text-xl font-semibold">{profile?.business_name}</h2>
										<VerificationBadge status={profile?.verification_status || "unverified"} />
									</div>
									<p className="text-muted-foreground text-sm">{displayName}</p>
									{profile?.email && <p className="text-muted-foreground text-sm">{profile.email}</p>}
									{profile?.operating_since && (
										<p className="text-sm text-muted-foreground mt-0.5">
											Operating since {profile.operating_since}
										</p>
									)}
								</div>
								{!isEditing ?
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditing(true)}>
										<Pencil className="size-3.5 mr-1.5" />
										Edit Profile
									</Button>
								:	<Button
										variant="ghost"
										size="sm"
										onClick={handleCancelEdit}>
										<X className="size-3.5 mr-1.5" />
										Cancel
									</Button>
								}
							</div>

							<div className="mt-3 flex items-center gap-2">
								<StarRating
									rating={profile?.average_rating || 0}
									size="sm"
								/>
								<span className="text-sm text-muted-foreground">
									({profile?.rating_count || 0} reviews)
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Verification Section */}
			{profile?.verification_status !== "verified" && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Account Verification</CardTitle>
						<CardDescription>
							{profile?.verification_status === "pending" ?
								"Your verification request is under review"
							:	"Submit a document to verify your account and start receiving interest requests"}
						</CardDescription>
					</CardHeader>
					{profile?.verification_status !== "pending" && (
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Document Type</Label>
								<Select
									value={documentForm.documentType}
									onValueChange={(value) =>
										setDocumentForm({ ...documentForm, documentType: value as DocumentType })
									}>
									<SelectTrigger>
										<SelectValue placeholder="Select document type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="property_document">Property Document</SelectItem>
										<SelectItem value="rental_agreement">Rental Agreement</SelectItem>
										<SelectItem value="owner_id">Owner ID</SelectItem>
										<SelectItem value="trade_license">Trade License</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Document URL</Label>
								<Input
									placeholder="https://..."
									value={documentForm.documentUrl}
									onChange={(e) => setDocumentForm({ ...documentForm, documentUrl: e.target.value })}
								/>
								<p className="text-xs text-muted-foreground">
									Upload your document to a file hosting service and paste the URL here
								</p>
							</div>
							<Button
								onClick={handleSubmitDocument}
								disabled={isSubmittingDoc}>
								{isSubmittingDoc ?
									<>
										<Loader2 className="size-4 animate-spin mr-2" />
										Submitting...
									</>
								:	"Submit for Verification"}
							</Button>
						</CardContent>
					)}
				</Card>
			)}

			{isEditing && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Edit Business Information</CardTitle>
						<CardDescription>Update your business details, then click Save Changes</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="businessName">Business Name</Label>
								<Input
									id="businessName"
									value={formData.businessName}
									onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
									placeholder="Your PG / hostel name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ownerFullName">Owner Name</Label>
								<Input
									id="ownerFullName"
									value={formData.ownerFullName}
									onChange={(e) => setFormData({ ...formData, ownerFullName: e.target.value })}
									placeholder="Your full name"
								/>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="businessPhone">Business Phone</Label>
								<Input
									id="businessPhone"
									placeholder="10-digit mobile number"
									value={formData.businessPhone}
									onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="operatingSince">Operating Since</Label>
								<Input
									id="operatingSince"
									type="number"
									placeholder="e.g., 2018"
									value={formData.operatingSince}
									onChange={(e) => setFormData({ ...formData, operatingSince: e.target.value })}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="businessDescription">Business Description</Label>
							<Textarea
								id="businessDescription"
								placeholder="Tell students about your PG/hostel..."
								value={formData.businessDescription}
								onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
								rows={4}
							/>
						</div>

						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={handleCancelEdit}
								disabled={isSaving}>
								Cancel
							</Button>
							<Button
								onClick={handleSave}
								disabled={isSaving}>
								{isSaving ?
									<>
										<Loader2 className="size-4 animate-spin mr-2" />
										Saving...
									</>
								:	<>
										<Save className="size-4 mr-2" />
										Save Changes
									</>
								}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{!isEditing && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Business Information</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-3">
							<InfoRow
								label="Business Name"
								value={profile?.business_name}
							/>
							<InfoRow
								label="Owner Name"
								value={profile?.owner_full_name}
							/>
							{profile?.business_phone && (
								<InfoRow
									label="Business Phone"
									value={profile.business_phone}
								/>
							)}
							<InfoRow
								label="Operating Since"
								value={profile?.operating_since?.toString()}
							/>
							<InfoRow
								label="Description"
								value={profile?.business_description}
							/>
						</dl>
					</CardContent>
				</Card>
			)}

			<EmailVerificationSection
				isVerified={isEmailVerified}
				refreshUser={refreshUser}
			/>

			<SessionsSection
				sessions={sessions}
				onSessionsChange={setSessions}
			/>
		</div>
	);
}

// ─── Shared display helpers ───────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="flex flex-col sm:flex-row sm:gap-4">
			<dt className="text-sm font-medium text-muted-foreground sm:w-36 shrink-0">{label}</dt>
			<dd className="text-sm mt-0.5 sm:mt-0">
				{value || <span className="text-muted-foreground/60 italic">Not set</span>}
			</dd>
		</div>
	);
}

function formatGenderDisplay(gender?: string | null) {
	if (!gender) return undefined;
	const map: Record<string, string> = {
		male: "Male",
		female: "Female",
		other: "Other",
		prefer_not_to_say: "Prefer not to say",
	};
	return map[gender] || gender;
}

// ─── Email Verification Section ───────────────────────────────────────────────
function EmailVerificationSection({
	isVerified,
	refreshUser,
}: {
	isVerified: boolean;
	refreshUser: () => Promise<void>;
}) {
	const [showOtpInput, setShowOtpInput] = useState(false);
	const [otp, setOtp] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSendOtp = async () => {
		setIsSending(true);
		setError(null);
		try {
			await sendOtp();
			setShowOtpInput(true);
			toast.success("OTP sent to your email");
		} catch (err) {
			if (err instanceof ApiClientError) {
				if (err.status === 409) {
					toast.info("Email already verified");
					await refreshUser();
				} else {
					toast.error(err.body.message || "Failed to send OTP");
				}
			} else {
				toast.error("Network error");
			}
		} finally {
			setIsSending(false);
		}
	};

	const handleVerifyOtp = async () => {
		if (otp.length !== 6) return;
		setIsVerifying(true);
		setError(null);
		try {
			await verifyOtp(otp);
			toast.success("Email verified successfully!");
			await refreshUser();
			setShowOtpInput(false);
			setOtp("");
		} catch (err) {
			if (err instanceof ApiClientError) {
				setError(err.body.message || "Invalid OTP");
			} else {
				setError("Network error");
			}
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle>Email Verification</CardTitle>
				<CardDescription>
					{isVerified ? "Your email has been verified" : "Verify your email to unlock full access"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isVerified ?
					<div className="flex items-center gap-2 text-emerald-600">
						<CheckCircle className="size-5" />
						<span className="font-medium">Email verified</span>
					</div>
				: showOtpInput ?
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your email</p>
						<OtpInput
							value={otp}
							onChange={setOtp}
							disabled={isVerifying}
						/>
						{error && <p className="text-sm text-destructive text-center">{error}</p>}
						<div className="flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => setShowOtpInput(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleVerifyOtp}
								disabled={isVerifying || otp.length !== 6}>
								{isVerifying ?
									<>
										<Loader2 className="size-4 animate-spin" />
										Verifying...
									</>
								:	"Verify"}
							</Button>
						</div>
						<p className="text-center text-sm text-muted-foreground">
							Didn&apos;t receive the code?{" "}
							<button
								onClick={handleSendOtp}
								disabled={isSending}
								className="text-primary hover:underline">
								Resend
							</button>
						</p>
					</div>
				:	<Button
						onClick={handleSendOtp}
						disabled={isSending}>
						{isSending ?
							<>
								<Loader2 className="size-4 animate-spin" />
								Sending...
							</>
						:	"Send OTP"}
					</Button>
				}
			</CardContent>
		</Card>
	);
}

// ─── Sessions Section ─────────────────────────────────────────────────────────
function SessionsSection({
	sessions,
	onSessionsChange,
}: {
	sessions: SessionItem[];
	onSessionsChange: (sessions: SessionItem[]) => void;
}) {
	const { logout } = useAuth();
	const [isRevoking, setIsRevoking] = useState<string | null>(null);
	const [showLogoutAll, setShowLogoutAll] = useState(false);

	const handleRevoke = async (sid: string) => {
		setIsRevoking(sid);
		try {
			await revokeSession(sid);
			onSessionsChange(sessions.filter((s) => s.sid !== sid));
			toast.success("Session revoked");
		} catch {
			toast.error("Failed to revoke session");
		} finally {
			setIsRevoking(null);
		}
	};

	const handleLogoutAll = async () => {
		try {
			await logoutAll();
			await logout();
			toast.success("Logged out from all devices");
		} catch {
			toast.error("Failed to logout");
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Active Sessions</CardTitle>
						<CardDescription>Manage your logged-in devices</CardDescription>
					</div>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setShowLogoutAll(true)}>
						Log Out All
					</Button>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{sessions.map((session) => (
							<div
								key={session.sid}
								className="flex items-center justify-between rounded-lg border p-3">
								<div>
									<div className="flex items-center gap-2">
										<span className="font-medium">Session</span>
										{session.isCurrent && (
											<Badge
												variant="secondary"
												className="text-xs">
												Current
											</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										Expires: {new Date(session.expiresAt).toLocaleDateString()}
									</p>
								</div>
								{!session.isCurrent && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRevoke(session.sid)}
										disabled={isRevoking === session.sid}>
										{isRevoking === session.sid ?
											<Loader2 className="size-4 animate-spin" />
										:	<Trash2 className="size-4" />}
									</Button>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<ConfirmDialog
				open={showLogoutAll}
				onOpenChange={setShowLogoutAll}
				title="Log out from all devices?"
				description="This will end all your active sessions including this one. You'll need to log in again."
				confirmLabel="Log Out All"
				onConfirm={handleLogoutAll}
				variant="destructive"
			/>
		</>
	);
}

function VerificationBadge({ status }: { status: string }) {
	switch (status) {
		case "verified":
			return (
				<Badge
					variant="success"
					className="gap-1">
					<CheckCircle className="size-3" />
					Verified
				</Badge>
			);
		case "pending":
			return (
				<Badge
					variant="warning"
					className="gap-1">
					<Clock className="size-3" />
					Pending
				</Badge>
			);
		case "rejected":
			return (
				<Badge
					variant="destructive"
					className="gap-1">
					<AlertCircle className="size-3" />
					Rejected
				</Badge>
			);
		default:
			return <Badge variant="secondary">Unverified</Badge>;
	}
}
