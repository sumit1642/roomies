// src/routes/_auth/connections.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "#/lib/queryKeys";
import { STALE } from "#/lib/queryClient";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Textarea } from "#/components/ui/textarea";
import { Label } from "#/components/ui/label";
import { UserAvatar } from "#/components/UserAvatar";
import { EmptyState } from "#/components/EmptyState";
import { StarRating } from "#/components/StarRating";
import { getMyConnections, confirmConnection, getConnection } from "#/lib/api/connections";
import { getStudentProfile, revealStudentContact } from "#/lib/api/profiles";
import { getConnectionRatings, submitRating } from "#/lib/api/ratings";
import { useAuth } from "#/context/AuthContext";
import type {
	ConnectionListItem,
	ConnectionDetail,
	StudentProfile,
	StudentContactReveal,
	ConnectionRatings,
} from "#/types";
import { toast } from "#/components/ui/sonner";
import {
	Users,
	Check,
	Clock,
	Loader2,
	Phone,
	Mail,
	GraduationCap,
	Star,
	ChevronRight,
	CheckCheck,
	Home,
	AlertCircle,
	Shield,
	MapPin,
	Calendar,
	User,
	ExternalLink,
	X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "#/lib/utils";
import { ApiClientError } from "#/lib/api";

export const Route = createFileRoute("/_auth/connections")({
	component: ConnectionsPage,
});

type TabFilter = "all" | "pending" | "confirmed";

// ─── Student Full Profile Modal ────────────────────────────────────────────────
// Shown when owner clicks on a student card
function StudentProfileModal({
	studentId,
	connectionId,
	open,
	onClose,
}: {
	studentId: string;
	connectionId: string;
	open: boolean;
	onClose: () => void;
}) {
	const [profile, setProfile] = useState<StudentProfile | null>(null);
	const [contact, setContact] = useState<StudentContactReveal | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [ratings, setRatings] = useState<ConnectionRatings | null>(null);

	useEffect(() => {
		if (!open || !studentId) return;
		setIsLoading(true);
		Promise.all([
			getStudentProfile(studentId).catch(() => null),
			revealStudentContact(studentId).catch(() => null),
			getConnectionRatings(connectionId).catch(() => null),
		])
			.then(([profileData, contactData, ratingsData]) => {
				setProfile(profileData);
				setContact(contactData);
				setRatings(ratingsData);
			})
			.finally(() => setIsLoading(false));
	}, [open, studentId, connectionId]);

	const getInitials = (name: string) => {
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const formatGender = (g: string | null) => {
		if (!g) return null;
		const map: Record<string, string> = {
			male: "Male",
			female: "Female",
			other: "Other",
			prefer_not_to_say: "Prefer not to say",
		};
		return map[g] || g;
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Student Profile</DialogTitle>
					<DialogDescription>Full details of this student</DialogDescription>
				</DialogHeader>

				{isLoading ?
					<div className="flex items-center justify-center py-16">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				: profile ?
					<div className="space-y-6">
						{/* Profile Header */}
						<div className="flex items-start gap-5 p-5 rounded-2xl bg-muted/40 border border-border/60">
							<Avatar className="size-20 ring-2 ring-border shrink-0">
								{profile.profile_photo_url && (
									<AvatarImage
										src={profile.profile_photo_url}
										alt={profile.full_name}
									/>
								)}
								<AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
									{getInitials(profile.full_name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-2 flex-wrap">
									<div>
										<h2 className="text-xl font-bold">{profile.full_name}</h2>
										{profile.course && (
											<p className="text-sm text-muted-foreground mt-0.5">
												{profile.course}
												{profile.year_of_study && ` · Year ${profile.year_of_study}`}
											</p>
										)}
									</div>
									<div className="flex flex-wrap gap-1.5">
										{profile.is_aadhaar_verified && (
											<Badge
												variant="success"
												className="text-xs gap-1">
												<Shield className="size-3" />
												Aadhaar Verified
											</Badge>
										)}
										{profile.is_email_verified && (
											<Badge
												variant="info"
												className="text-xs gap-1">
												<Check className="size-3" />
												Email Verified
											</Badge>
										)}
									</div>
								</div>
								{profile.average_rating > 0 && (
									<div className="flex items-center gap-2 mt-2">
										<StarRating
											rating={profile.average_rating}
											size="sm"
											showValue
										/>
										<span className="text-xs text-muted-foreground">
											({profile.rating_count} review{profile.rating_count !== 1 ? "s" : ""})
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Contact Information */}
						{contact && (
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
									Contact Information
								</h3>
								<div className="space-y-2">
									<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
										<Mail className="size-4 text-muted-foreground shrink-0" />
										<div className="flex-1 min-w-0">
											<p className="text-xs text-muted-foreground">Email</p>
											<a
												href={`mailto:${contact.email}`}
												className="text-sm font-medium text-primary hover:underline truncate block">
												{contact.email}
											</a>
										</div>
									</div>
									{contact.whatsapp_phone && (
										<div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
											<Phone className="size-4 text-emerald-600 shrink-0" />
											<div className="flex-1 min-w-0">
												<p className="text-xs text-emerald-700 dark:text-emerald-400">
													WhatsApp
												</p>
												<a
													href={`https://wa.me/${contact.whatsapp_phone.replace(/\D/g, "")}`}
													target="_blank"
													rel="noreferrer"
													className="text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1">
													{contact.whatsapp_phone}
													<ExternalLink className="size-3" />
												</a>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						<Separator />

						{/* Personal Details */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
								Personal Details
							</h3>
							<div className="grid grid-cols-2 gap-3">
								{profile.gender && (
									<DetailItem
										icon={User}
										label="Gender"
										value={formatGender(profile.gender) ?? "—"}
									/>
								)}
								{profile.date_of_birth && (
									<DetailItem
										icon={Calendar}
										label="Date of Birth"
										value={new Date(profile.date_of_birth).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									/>
								)}
								{profile.course && (
									<DetailItem
										icon={GraduationCap}
										label="Course"
										value={profile.course}
									/>
								)}
								{profile.year_of_study && (
									<DetailItem
										icon={GraduationCap}
										label="Year of Study"
										value={`Year ${profile.year_of_study}`}
									/>
								)}
							</div>
						</div>

						{/* Bio */}
						{profile.bio && (
							<>
								<Separator />
								<div className="space-y-2">
									<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
										About
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
								</div>
							</>
						)}

						{/* Connection Ratings */}
						{ratings && (ratings.myRatings.length > 0 || ratings.theirRatings.length > 0) && (
							<>
								<Separator />
								<div className="space-y-3">
									<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
										Connection Ratings
									</h3>
									{ratings.theirRatings.map((r) => (
										<div
											key={r.ratingId}
											className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1.5">
											<div className="flex items-center justify-between">
												<span className="text-xs text-muted-foreground">
													Their rating of you
												</span>
												<StarRating
													rating={r.overallScore}
													size="sm"
													showValue
												/>
											</div>
											{r.comment && (
												<p className="text-sm italic text-muted-foreground">"{r.comment}"</p>
											)}
										</div>
									))}
								</div>
							</>
						)}
					</div>
				:	<div className="flex flex-col items-center gap-3 py-12 text-center">
						<AlertCircle className="size-10 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">Failed to load student profile</p>
					</div>
				}
			</DialogContent>
		</Dialog>
	);
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
	return (
		<div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
			<Icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
			<div>
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="text-sm font-medium">{value}</p>
			</div>
		</div>
	);
}

// ─── Rate Connection Dialog ────────────────────────────────────────────────────
function RateConnectionDialog({
	connection,
	open,
	onClose,
	onRated,
}: {
	connection: ConnectionDetail | null;
	open: boolean;
	onClose: () => void;
	onRated: () => void;
}) {
	const { user } = useAuth();
	const [overallScore, setOverallScore] = useState(0);
	const [cleanlinessScore, setCleanlinessScore] = useState(0);
	const [communicationScore, setCommunicationScore] = useState(0);
	const [reliabilityScore, setReliabilityScore] = useState(0);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!connection) return null;

	const handleSubmit = async () => {
		if (overallScore === 0) {
			toast.error("Please provide an overall rating");
			return;
		}
		setIsSubmitting(true);
		try {
			await submitRating({
				connectionId: connection.connectionId,
				revieweeType: "user",
				revieweeId: connection.otherParty.userId,
				overallScore,
				cleanlinessScore: cleanlinessScore > 0 ? cleanlinessScore : undefined,
				communicationScore: communicationScore > 0 ? communicationScore : undefined,
				reliabilityScore: reliabilityScore > 0 ? reliabilityScore : undefined,
				comment: comment.trim() || undefined,
			});
			toast.success("Rating submitted successfully!");
			onRated();
			onClose();
		} catch (err) {
			if (err instanceof ApiClientError && err.status === 409) {
				toast.error("You have already rated this connection");
			} else if (err instanceof ApiClientError && err.status === 422) {
				toast.error("Can only rate confirmed connections");
			} else {
				toast.error("Failed to submit rating");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const ScoreRow = ({
		label,
		value,
		onChange,
		required = false,
	}: {
		label: string;
		value: number;
		onChange: (v: number) => void;
		required?: boolean;
	}) => (
		<div className="flex items-center justify-between">
			<span className="text-sm text-muted-foreground">
				{label}
				{required && <span className="text-destructive ml-0.5">*</span>}
			</span>
			<div className="flex gap-1">
				{[1, 2, 3, 4, 5].map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => onChange(value === s ? 0 : s)}
						className="p-0.5 transition-transform hover:scale-110">
						<Star
							className={cn(
								"size-5 stroke-amber-400 transition-colors",
								s <= value ? "fill-amber-400" : "fill-transparent",
							)}
						/>
					</button>
				))}
			</div>
		</div>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Rate Your Experience</DialogTitle>
					<DialogDescription>Share your experience with {connection.otherParty.fullName}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<ScoreRow
						label="Overall"
						value={overallScore}
						onChange={setOverallScore}
						required
					/>
					<ScoreRow
						label="Cleanliness"
						value={cleanlinessScore}
						onChange={setCleanlinessScore}
					/>
					<ScoreRow
						label="Communication"
						value={communicationScore}
						onChange={setCommunicationScore}
					/>
					<ScoreRow
						label="Reliability"
						value={reliabilityScore}
						onChange={setReliabilityScore}
					/>
					<div className="space-y-1.5">
						<Label>Comment (optional)</Label>
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Share your experience..."
							rows={3}
							maxLength={2000}
						/>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={onClose}
							disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleSubmit}
							disabled={isSubmitting || overallScore === 0}>
							{isSubmitting ?
								<Loader2 className="size-4 animate-spin mr-2" />
							:	null}
							Submit Rating
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ─── Connection Card ───────────────────────────────────────────────────────────
function ConnectionCard({
	connection,
	isOwner,
	isProcessing,
	onConfirm,
	onViewDetail,
	onViewStudentProfile,
}: {
	connection: ConnectionListItem;
	isOwner: boolean;
	isProcessing: boolean;
	onConfirm: () => void;
	onViewDetail: () => void;
	onViewStudentProfile?: () => void;
}) {
	const isConfirmed = connection.confirmationStatus === "confirmed";
	const name = connection.otherParty.fullName || (isOwner ? "Student" : "PG Owner");

	return (
		<Card
			className={cn(
				"overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
				!isConfirmed && "border-amber-200/60 dark:border-amber-900/60",
			)}
			onClick={isOwner && onViewStudentProfile ? onViewStudentProfile : onViewDetail}>
			<CardHeader className="pb-3 pt-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<UserAvatar
							name={name}
							photoUrl={connection.otherParty.profilePhotoUrl}
							size="md"
						/>
						<div>
							<CardTitle className="text-base">{name}</CardTitle>
							<CardDescription className="text-xs mt-0.5">
								{isOwner ? "Student" : "PG Owner"}
							</CardDescription>
						</div>
					</div>
					<div className="flex flex-col items-end gap-1">
						{isConfirmed ?
							<Badge
								variant="success"
								className="text-xs">
								<CheckCheck className="size-3 mr-1" />
								Confirmed
							</Badge>
						:	<Badge
								variant="warning"
								className="text-xs">
								<Clock className="size-3 mr-1" />
								Pending
							</Badge>
						}
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-4">
				{connection.listing && (
					<div className="mb-3 p-2.5 bg-muted/50 rounded-lg text-sm">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Home className="size-3.5 shrink-0" />
							<span className="truncate font-medium text-foreground">{connection.listing.title}</span>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5 ml-5">{connection.listing.city}</p>
					</div>
				)}

				{connection.otherParty.averageRating > 0 && (
					<div className="mb-3 flex items-center gap-1.5">
						<StarRating
							rating={connection.otherParty.averageRating}
							size="sm"
						/>
						<span className="text-xs text-muted-foreground">
							{connection.otherParty.averageRating.toFixed(1)}
						</span>
					</div>
				)}

				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						{formatDistanceToNow(new Date(connection.createdAt), { addSuffix: true })}
					</p>
					<div className="flex items-center gap-2">
						{!isConfirmed && (
							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									onConfirm();
								}}
								disabled={isProcessing}
								className="text-xs h-7">
								{isProcessing ?
									<Loader2 className="size-3.5 animate-spin" />
								:	<>
										<Check className="size-3.5 mr-1" />
										Confirm
									</>
								}
							</Button>
						)}
						<Button
							size="sm"
							variant="ghost"
							className="text-xs h-7"
							onClick={(e) => {
								e.stopPropagation();
								onViewDetail();
							}}>
							Details
							<ChevronRight className="size-3.5 ml-0.5" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Connection Detail View ────────────────────────────────────────────────────
function ConnectionDetailView({
	detail,
	isOwner,
	onConfirm,
	onViewStudentProfile,
	onRate,
	hasRated,
}: {
	detail: ConnectionDetail;
	isOwner: boolean;
	onConfirm: () => void;
	onViewStudentProfile?: () => void;
	onRate: () => void;
	hasRated: boolean;
}) {
	const name = detail.otherParty.fullName || (isOwner ? "Student" : "PG Owner");
	const isConfirmed = detail.confirmationStatus === "confirmed";

	return (
		<div className="space-y-6">
			{/* Person Header */}
			<div className="flex items-start gap-4">
				<UserAvatar
					name={name}
					photoUrl={detail.otherParty.profilePhotoUrl}
					size="xl"
				/>
				<div className="flex-1">
					<h3 className="text-xl font-bold">{name}</h3>
					<p className="text-sm text-muted-foreground">{isOwner ? "Student" : "PG Owner"}</p>
					{detail.otherParty.averageRating > 0 && (
						<div className="flex items-center gap-2 mt-1.5">
							<StarRating
								rating={detail.otherParty.averageRating}
								size="sm"
								showValue
							/>
							<span className="text-xs text-muted-foreground">
								({(detail.otherParty as { ratingCount?: number }).ratingCount ?? 0} reviews)
							</span>
						</div>
					)}
					{/* View full profile button for owner */}
					{isOwner && onViewStudentProfile && (
						<Button
							variant="outline"
							size="sm"
							className="mt-3 gap-1.5"
							onClick={onViewStudentProfile}>
							<User className="size-3.5" />
							View Full Profile
						</Button>
					)}
				</div>
				{isConfirmed ?
					<Badge variant="success">
						<CheckCheck className="size-3.5 mr-1" />
						Confirmed
					</Badge>
				:	<Badge variant="warning">
						<Clock className="size-3.5 mr-1" />
						Pending
					</Badge>
				}
			</div>

			<Separator />

			{/* Confirmation Status */}
			<div className="space-y-3">
				<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Confirmation Status
				</h4>
				<div className="grid grid-cols-2 gap-3">
					<div
						className={cn(
							"p-3 rounded-lg border text-sm text-center",
							detail.initiatorConfirmed ?
								"bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
							:	"bg-muted border-border",
						)}>
						<Check
							className={cn(
								"size-4 mx-auto mb-1",
								detail.initiatorConfirmed ? "text-emerald-600" : "text-muted-foreground",
							)}
						/>
						<p className="font-medium text-xs">Student</p>
						<p className="text-xs text-muted-foreground">
							{detail.initiatorConfirmed ? "Confirmed" : "Pending"}
						</p>
					</div>
					<div
						className={cn(
							"p-3 rounded-lg border text-sm text-center",
							detail.counterpartConfirmed ?
								"bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
							:	"bg-muted border-border",
						)}>
						<Check
							className={cn(
								"size-4 mx-auto mb-1",
								detail.counterpartConfirmed ? "text-emerald-600" : "text-muted-foreground",
							)}
						/>
						<p className="font-medium text-xs">PG Owner</p>
						<p className="text-xs text-muted-foreground">
							{detail.counterpartConfirmed ? "Confirmed" : "Pending"}
						</p>
					</div>
				</div>

				{!isConfirmed && (
					<Button
						onClick={onConfirm}
						className="w-full"
						size="sm">
						<Check className="size-4 mr-2" />
						Confirm My Side (met in person)
					</Button>
				)}

				{/* Rate button for confirmed connections */}
				{isConfirmed && !hasRated && (
					<Button
						onClick={onRate}
						variant="outline"
						className="w-full"
						size="sm">
						<Star className="size-4 mr-2" />
						Rate This Experience
					</Button>
				)}
				{isConfirmed && hasRated && (
					<div className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg p-2">
						<CheckCheck className="size-4" />
						You have rated this connection
					</div>
				)}
			</div>

			{/* Listing Info */}
			{detail.listing && (
				<>
					<Separator />
					<div className="space-y-2">
						<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Listing</h4>
						<div className="p-3 bg-muted/50 rounded-lg">
							<p className="font-semibold">{detail.listing.title}</p>
							<p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
								<MapPin className="size-3.5" />
								{detail.listing.city}
							</p>
							{detail.listing.rentPerMonth != null && (
								<p className="text-sm font-medium mt-1">
									₹{detail.listing.rentPerMonth.toLocaleString("en-IN")}/month
								</p>
							)}
						</div>
					</div>
				</>
			)}

			{/* Timeline */}
			<Separator />
			<div className="space-y-2">
				<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h4>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Connected</span>
						<span>{formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })}</span>
					</div>
					{detail.startDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Start Date</span>
							<span>{detail.startDate}</span>
						</div>
					)}
					{detail.endDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">End Date</span>
							<span>{detail.endDate}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ConnectionsPage() {
	const { user, role } = useAuth();
	const qc = useQueryClient();
	const [activeTab, setActiveTab] = useState<TabFilter>("all");
	const [processingId, setProcessingId] = useState<string | null>(null);

	// Detail dialog
	const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// Student profile modal (owner-only)
	const [studentProfileState, setStudentProfileState] = useState<{
		studentId: string;
		connectionId: string;
	} | null>(null);

	// Rating dialog
	const [ratingTarget, setRatingTarget] = useState<ConnectionDetail | null>(null);
	const [ratedConnectionIds, setRatedConnectionIds] = useState<Set<string>>(new Set());

	const isOwner = role === "pg_owner";

	// ── Connections list ────────────────────────────────────────────────────
	const { data: connectionsData, isLoading } = useQuery({
		queryKey: queryKeys.connections(),
		queryFn: () => getMyConnections(),
		staleTime: STALE.TRANSACTIONAL,
	});
	const connections: ConnectionListItem[] = connectionsData?.items ?? [];

	// ── Connection detail ───────────────────────────────────────────────────
	const { data: connectionDetail, isLoading: isLoadingDetail } = useQuery({
		queryKey: queryKeys.connection(selectedConnectionId ?? ""),
		queryFn: () => getConnection(selectedConnectionId!),
		enabled: !!selectedConnectionId && detailOpen,
		staleTime: STALE.TRANSACTIONAL,
	});

	// ── Confirm connection mutation ──────────────────────────────────────────
	const confirmMutation = useMutation({
		mutationFn: (connectionId: string) => confirmConnection(connectionId),
		onMutate: (connectionId) => setProcessingId(connectionId),
		onSuccess: (_data, connectionId) => {
			toast.success("Connection confirmed from your side!");
			qc.invalidateQueries({ queryKey: queryKeys.connections() });
			qc.invalidateQueries({ queryKey: queryKeys.connection(connectionId) });
		},
		onError: () => toast.error("Failed to confirm connection"),
		onSettled: () => setProcessingId(null),
	});

	const handleConfirmConnection = (connectionId: string) => confirmMutation.mutate(connectionId);

	const handleOpenDetail = (connectionId: string) => {
		setSelectedConnectionId(connectionId);
		setDetailOpen(true);
	};

	const handleOpenStudentProfile = (studentId: string, connectionId: string) => {
		setStudentProfileState({ studentId, connectionId });
	};

	const filteredConnections = connections.filter((conn) => {
		if (activeTab === "pending") return conn.confirmationStatus !== "confirmed";
		if (activeTab === "confirmed") return conn.confirmationStatus === "confirmed";
		return true;
	});

	const pendingCount = connections.filter((c) => c.confirmationStatus !== "confirmed").length;
	const confirmedCount = connections.filter((c) => c.confirmationStatus === "confirmed").length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Connections</h1>
				<p className="text-muted-foreground mt-1">
					{isOwner ? "Students who matched with your listings" : "Your connections with PG owners"}
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as TabFilter)}>
				<TabsList>
					<TabsTrigger value="all">All ({connections.length})</TabsTrigger>
					<TabsTrigger value="pending">
						Pending ({pendingCount})
						{pendingCount > 0 && <span className="ml-1.5 size-2 rounded-full bg-amber-500 inline-block" />}
					</TabsTrigger>
					<TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
				</TabsList>

				<TabsContent
					value={activeTab}
					className="mt-6">
					{filteredConnections.length === 0 ?
						<EmptyState
							icon={Users}
							title={
								activeTab === "pending" ? "No pending connections"
								: activeTab === "confirmed" ?
									"No confirmed connections yet"
								:	"No connections yet"
							}
							description={
								isOwner ?
									"When students accept interest requests on your listings, connections appear here."
								:	"Express interest in listings to connect with PG owners."
							}
						/>
					:	<div className="grid gap-4 md:grid-cols-2">
							{filteredConnections.map((connection) => (
								<ConnectionCard
									key={connection.connectionId}
									connection={connection}
									isOwner={isOwner}
									isProcessing={processingId === connection.connectionId}
									onConfirm={() => handleConfirmConnection(connection.connectionId)}
									onViewDetail={() => handleOpenDetail(connection.connectionId)}
									onViewStudentProfile={
										isOwner ?
											() =>
												handleOpenStudentProfile(
													connection.otherParty.userId,
													connection.connectionId,
												)
										:	undefined
									}
								/>
							))}
						</div>
					}
				</TabsContent>
			</Tabs>

			{/* Connection Detail Dialog */}
			<Dialog
				open={detailOpen}
				onOpenChange={(open) => {
					if (!open) {
						setDetailOpen(false);
						setSelectedConnectionId(null);
					}
				}}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Connection Details</DialogTitle>
						<DialogDescription>Full details about this connection</DialogDescription>
					</DialogHeader>

					{isLoadingDetail ?
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					: connectionDetail ?
						<ConnectionDetailView
							detail={connectionDetail}
							isOwner={isOwner}
							onConfirm={() => handleConfirmConnection(connectionDetail.connectionId)}
							onViewStudentProfile={
								isOwner ?
									() => {
										setDetailOpen(false);
										handleOpenStudentProfile(
											connectionDetail.otherParty.userId,
											connectionDetail.connectionId,
										);
									}
								:	undefined
							}
							onRate={() => setRatingTarget(connectionDetail)}
							hasRated={ratedConnectionIds.has(connectionDetail.connectionId)}
						/>
					:	null}
				</DialogContent>
			</Dialog>

			{/* Student Profile Modal (owner-only) */}
			{studentProfileState && (
				<StudentProfileModal
					studentId={studentProfileState.studentId}
					connectionId={studentProfileState.connectionId}
					open={!!studentProfileState}
					onClose={() => setStudentProfileState(null)}
				/>
			)}

			{/* Rating Dialog */}
			<RateConnectionDialog
				connection={ratingTarget}
				open={!!ratingTarget}
				onClose={() => setRatingTarget(null)}
				onRated={() => {
					if (ratingTarget) {
						setRatedConnectionIds((prev) => new Set(prev).add(ratingTarget.connectionId));
					}
					setRatingTarget(null);
				}}
			/>
		</div>
	);
}
