// src/routes/_auth/_pgowner/listings.tsx
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { EmptyState } from "#/components/EmptyState";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { AmenityPicker } from "#/components/AmenityPicker";
import { PreferencePicker } from "#/components/PreferencePicker";
import { StarRating } from "#/components/StarRating";
import { searchListings, createListing, updateListingStatus, deleteListing } from "#/lib/api/listings";
import { getMyProperties } from "#/lib/api/properties";
import { getListingInterests, updateInterestStatus } from "#/lib/api/interests";
import { getStudentProfile, revealStudentContact } from "#/lib/api/profiles";
import { formatCurrency } from "#/lib/format";
import { toast } from "#/components/ui/sonner";
import {
	Plus,
	Bed,
	IndianRupee,
	Trash2,
	ToggleLeft,
	ToggleRight,
	Users,
	Loader2,
	Check,
	X,
	GraduationCap,
	Mail,
	Phone,
	Star,
	ChevronRight,
	Heart,
	MessageSquare,
	Shield,
	User,
	ExternalLink,
	AlertCircle,
	MessageCircle,
} from "lucide-react";
import type {
	ListingSearchItem,
	PropertyListItem,
	InterestRequestWithStudent,
	AcceptedInterestResponse,
	PreferencePair,
	StudentProfile,
	StudentContactReveal,
} from "#/types";
import type { CreateListingInput } from "#/lib/api/listings";
import { formatDistanceToNow } from "date-fns";
import { ApiClientError } from "#/lib/api";

export const Route = createFileRoute("/_auth/_pgowner/listings")({
	component: ListingsPage,
	validateSearch: (search: Record<string, unknown>) => ({
		property_id: search.property_id as string | undefined,
	}),
});

type ListingFormData = Omit<Partial<CreateListingInput>, "amenityIds" | "preferences"> & {
	amenityIds: string[];
	preferences: PreferencePair[];
};

// ─── Listing Form ──────────────────────────────────────────────────────────────
interface ListingFormProps {
	formData: ListingFormData;
	onChange: (data: ListingFormData) => void;
	onSubmit: (e: React.FormEvent) => void;
	isSubmitting: boolean;
	properties: PropertyListItem[];
}

function ListingForm({ formData, onChange, onSubmit, isSubmitting, properties }: ListingFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="space-y-5">
			<div className="space-y-2">
				<Label>Property *</Label>
				<Select
					value={formData.propertyId || ""}
					onValueChange={(value) => onChange({ ...formData, propertyId: value })}>
					<SelectTrigger>
						<SelectValue placeholder="Select property" />
					</SelectTrigger>
					<SelectContent>
						{properties.map((property) => (
							<SelectItem
								key={property.property_id}
								value={property.property_id}>
								{property.property_name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label>Listing Type *</Label>
				<Select
					value={formData.listingType || "pg_room"}
					onValueChange={(value) =>
						onChange({ ...formData, listingType: value as CreateListingInput["listingType"] })
					}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="pg_room">PG Room</SelectItem>
						<SelectItem value="hostel_bed">Hostel Bed</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="listing-title">Title *</Label>
				<Input
					id="listing-title"
					value={formData.title || ""}
					onChange={(e) => onChange({ ...formData, title: e.target.value })}
					placeholder="e.g., Spacious Single Room with AC"
					required
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Room Type *</Label>
					<Select
						value={formData.roomType || "single"}
						onValueChange={(value) =>
							onChange({ ...formData, roomType: value as CreateListingInput["roomType"] })
						}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="single">Single</SelectItem>
							<SelectItem value="double">Double</SelectItem>
							<SelectItem value="triple">Triple</SelectItem>
							<SelectItem value="entire_flat">Entire Flat</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Gender Preference</Label>
					<Select
						value={formData.preferredGender || "prefer_not_to_say"}
						onValueChange={(value) =>
							onChange({
								...formData,
								preferredGender: value as CreateListingInput["preferredGender"],
							})
						}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="prefer_not_to_say">Any</SelectItem>
							<SelectItem value="male">Male</SelectItem>
							<SelectItem value="female">Female</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="listing-rent">Monthly Rent (₹) *</Label>
					<Input
						id="listing-rent"
						type="number"
						value={formData.rentPerMonth ?? ""}
						onChange={(e) =>
							onChange({
								...formData,
								rentPerMonth: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						placeholder="e.g., 8000"
						min="0"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="listing-deposit">Deposit (₹)</Label>
					<Input
						id="listing-deposit"
						type="number"
						value={formData.depositAmount ?? ""}
						onChange={(e) =>
							onChange({
								...formData,
								depositAmount: e.target.value ? Number(e.target.value) : undefined,
							})
						}
						placeholder="e.g., 16000"
						min="0"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="listing-capacity">Total Capacity *</Label>
					<Input
						id="listing-capacity"
						type="number"
						value={formData.totalCapacity ?? 1}
						onChange={(e) => onChange({ ...formData, totalCapacity: Number(e.target.value) })}
						min="1"
						max="20"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="listing-available">Available From *</Label>
					<Input
						id="listing-available"
						type="date"
						value={formData.availableFrom || ""}
						onChange={(e) => onChange({ ...formData, availableFrom: e.target.value })}
						required
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="listing-description">Description</Label>
				<Textarea
					id="listing-description"
					value={formData.description || ""}
					onChange={(e) => onChange({ ...formData, description: e.target.value })}
					placeholder="Describe the room features, rules, location highlights..."
					rows={3}
				/>
			</div>

			<Separator />

			<div className="space-y-2">
				<Label>Amenities</Label>
				<p className="text-xs text-muted-foreground">Select all amenities available for this listing</p>
				<AmenityPicker
					selectedIds={formData.amenityIds}
					onChange={(ids) => onChange({ ...formData, amenityIds: ids })}
					disabled={isSubmitting}
				/>
			</div>

			<Separator />

			<div className="space-y-2">
				<Label>Tenant Preferences</Label>
				<p className="text-xs text-muted-foreground">
					Set preferred lifestyle traits for ideal tenants (optional)
				</p>
				<PreferencePicker
					value={formData.preferences}
					onChange={(prefs) => onChange({ ...formData, preferences: prefs })}
					disabled={isSubmitting}
					allowClear
				/>
			</div>

			<DialogFooter>
				<Button
					type="submit"
					disabled={isSubmitting}>
					{isSubmitting ?
						<>
							<Loader2 className="size-4 animate-spin mr-2" />
							Creating...
						</>
					:	"Create Listing"}
				</Button>
			</DialogFooter>
		</form>
	);
}

// ─── Accept Success Banner ─────────────────────────────────────────────────────
// Shown after an interest is accepted, surfacing whatsappLink and listingFilled.
function AcceptSuccessBanner({
	result,
	studentName,
	onClose,
}: {
	result: AcceptedInterestResponse;
	studentName: string;
	onClose: () => void;
}) {
	return (
		<div className="space-y-4">
			<div className="flex flex-col items-center gap-3 py-4 text-center">
				<div className="size-12 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
					<Check className="size-6 text-emerald-600" />
				</div>
				<div>
					<h3 className="font-semibold text-lg">Interest Accepted!</h3>
					<p className="text-sm text-muted-foreground mt-1">
						A connection has been created with <span className="font-medium">{studentName}</span>.
					</p>
					{result.listingFilled && (
						<p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
							Your listing has been marked as filled (capacity reached).
						</p>
					)}
				</div>
			</div>

			{result.whatsappLink ?
				<a
					href={result.whatsappLink}
					target="_blank"
					rel="noreferrer"
					className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#22c55e] text-white px-4 py-3 font-semibold text-sm transition-colors">
					<svg
						viewBox="0 0 24 24"
						className="size-5 fill-current"
						aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					Message {studentName} on WhatsApp
				</a>
			:	<div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
					<MessageCircle className="size-4 text-muted-foreground mx-auto mb-1" />
					<p className="text-xs text-muted-foreground">
						{studentName} hasn't added a WhatsApp number yet. You can reach them via email through the
						Connections page.
					</p>
				</div>
			}

			<Button
				variant="outline"
				className="w-full"
				onClick={onClose}>
				Close
			</Button>
		</div>
	);
}

// ─── Student Detail Modal ──────────────────────────────────────────────────────
function StudentDetailModal({
	interest,
	open,
	onClose,
	onAccept,
	onDecline,
}: {
	interest: InterestRequestWithStudent | null;
	open: boolean;
	onClose: () => void;
	onAccept: (id: string) => Promise<AcceptedInterestResponse>;
	onDecline: (id: string) => Promise<void>;
}) {
	const [isActing, setIsActing] = useState<"accept" | "decline" | null>(null);
	const [profile, setProfile] = useState<StudentProfile | null>(null);
	const [contact, setContact] = useState<StudentContactReveal | null>(null);
	const [isLoadingExtra, setIsLoadingExtra] = useState(false);
	const [acceptResult, setAcceptResult] = useState<AcceptedInterestResponse | null>(null);

	useEffect(() => {
		if (!open || !interest) return;
		// Reset accept result when modal opens for a new interest
		setAcceptResult(null);
		setProfile(null);
		setContact(null);
		setIsLoadingExtra(true);
		Promise.all([
			getStudentProfile(interest.student.userId).catch(() => null),
			revealStudentContact(interest.student.userId).catch(() => null),
		])
			.then(([p, c]) => {
				setProfile(p);
				setContact(c);
			})
			.finally(() => setIsLoadingExtra(false));
	}, [open, interest?.student.userId]);

	if (!interest) return null;

	const { student } = interest;
	const initial = student.fullName?.charAt(0)?.toUpperCase() ?? "?";

	const handleAccept = async () => {
		setIsActing("accept");
		try {
			const result = await onAccept(interest.interestRequestId);
			// Show the success banner with WhatsApp link instead of closing
			setAcceptResult(result);
		} finally {
			setIsActing(null);
		}
	};

	const handleDecline = async () => {
		setIsActing("decline");
		try {
			await onDecline(interest.interestRequestId);
			onClose();
		} finally {
			setIsActing(null);
		}
	};

	const handleClose = () => {
		setAcceptResult(null);
		onClose();
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
			onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Student Interest Request</DialogTitle>
					<DialogDescription>Review this student's profile before responding</DialogDescription>
				</DialogHeader>

				{/* Show success banner after accepting */}
				{acceptResult ?
					<AcceptSuccessBanner
						result={acceptResult}
						studentName={student.fullName}
						onClose={handleClose}
					/>
				:	<div className="space-y-5">
						{/* Student Profile Header */}
						<div className="flex items-start gap-4 p-4 bg-muted/40 rounded-xl">
							<Avatar className="size-16 ring-2 ring-border shrink-0">
								{student.profilePhotoUrl && (
									<AvatarImage
										src={student.profilePhotoUrl}
										alt={student.fullName}
									/>
								)}
								<AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
									{initial}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<h3 className="text-lg font-bold">{student.fullName}</h3>
								<p className="text-sm text-muted-foreground">Student</p>
								{student.averageRating > 0 && (
									<div className="flex items-center gap-1.5 mt-1.5">
										<StarRating
											rating={student.averageRating}
											size="sm"
										/>
										<span className="text-xs text-muted-foreground">
											{student.averageRating.toFixed(1)} rating
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Extra profile details (loaded async) */}
						{isLoadingExtra ?
							<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
								<Loader2 className="size-4 animate-spin" />
								Loading profile details...
							</div>
						:	<>
								{/* Contact Info */}
								{contact && (
									<div className="space-y-2">
										<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
											Contact
										</h4>
										<div className="space-y-2">
											<div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border/50">
												<Mail className="size-4 text-muted-foreground shrink-0" />
												<a
													href={`mailto:${contact.email}`}
													className="text-sm text-primary hover:underline truncate">
													{contact.email}
												</a>
											</div>
											{contact.whatsapp_phone && (
												<div className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
													<Phone className="size-4 text-emerald-600 shrink-0" />
													<a
														href={`https://wa.me/${contact.whatsapp_phone.replace(/\D/g, "")}`}
														target="_blank"
														rel="noreferrer"
														className="text-sm text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1">
														{contact.whatsapp_phone}
														<ExternalLink className="size-3" />
													</a>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Profile Details */}
								{profile && (
									<div className="space-y-2">
										<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
											Profile Details
										</h4>
										<div className="grid grid-cols-2 gap-2">
											{profile.course && (
												<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
													<GraduationCap className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
													<div>
														<p className="text-xs text-muted-foreground">Course</p>
														<p className="text-sm font-medium truncate">{profile.course}</p>
													</div>
												</div>
											)}
											{profile.year_of_study && (
												<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
													<GraduationCap className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
													<div>
														<p className="text-xs text-muted-foreground">Year</p>
														<p className="text-sm font-medium">
															Year {profile.year_of_study}
														</p>
													</div>
												</div>
											)}
											{profile.gender && (
												<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50">
													<User className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
													<div>
														<p className="text-xs text-muted-foreground">Gender</p>
														<p className="text-sm font-medium">
															{formatGender(profile.gender)}
														</p>
													</div>
												</div>
											)}
											{profile.is_aadhaar_verified && (
												<div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950">
													<Shield className="size-3.5 text-emerald-600" />
													<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
														Aadhaar Verified
													</p>
												</div>
											)}
										</div>
										{profile.bio && (
											<div className="p-3 bg-muted/50 rounded-lg">
												<p className="text-xs text-muted-foreground mb-1">Bio</p>
												<p className="text-sm line-clamp-3">{profile.bio}</p>
											</div>
										)}
									</div>
								)}
							</>
						}

						{/* Interest Message */}
						{interest.message && (
							<>
								<Separator />
								<div className="space-y-2">
									<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
										<MessageSquare className="size-3.5" />
										Message
									</h4>
									<div className="p-3 bg-muted/50 rounded-lg border border-border/50">
										<p className="text-sm italic">"{interest.message}"</p>
									</div>
								</div>
							</>
						)}

						<div className="text-xs text-muted-foreground">
							Sent {formatDistanceToNow(new Date(interest.createdAt), { addSuffix: true })}
						</div>

						<Separator />

						{/* Actions */}
						<div className="flex gap-3">
							<Button
								className="flex-1"
								onClick={handleAccept}
								disabled={!!isActing}>
								{isActing === "accept" ?
									<Loader2 className="size-4 animate-spin mr-2" />
								:	<Check className="size-4 mr-2" />}
								Accept Interest
							</Button>
							<Button
								variant="outline"
								className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
								onClick={handleDecline}
								disabled={!!isActing}>
								{isActing === "decline" ?
									<Loader2 className="size-4 animate-spin mr-2" />
								:	<X className="size-4 mr-2" />}
								Decline
							</Button>
						</div>
					</div>
				}
			</DialogContent>
		</Dialog>
	);
}

// ─── Interests Panel Dialog ────────────────────────────────────────────────────
function InterestsPanelDialog({
	listingId,
	listingTitle,
	open,
	onClose,
	onDataChange,
}: {
	listingId: string;
	listingTitle: string;
	open: boolean;
	onClose: () => void;
	onDataChange: () => void;
}) {
	const [interests, setInterests] = useState<InterestRequestWithStudent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedInterest, setSelectedInterest] = useState<InterestRequestWithStudent | null>(null);
	const [activeTab, setActiveTab] = useState<"pending" | "accepted">("pending");

	useEffect(() => {
		if (open) {
			fetchInterests();
		}
	}, [open, listingId, activeTab]);

	const fetchInterests = async () => {
		setIsLoading(true);
		try {
			const res = await getListingInterests(listingId, activeTab as "pending" | "accepted");
			setInterests(res.items);
		} catch {
			toast.error("Failed to load interest requests");
		} finally {
			setIsLoading(false);
		}
	};

	const handleAccept = async (interestId: string): Promise<AcceptedInterestResponse> => {
		try {
			const result = await updateInterestStatus(interestId, "accepted");
			// Remove from pending list
			setInterests((prev) => prev.filter((i) => i.interestRequestId !== interestId));
			onDataChange();
			// The result may be AcceptedInterestResponse or InterestRequest
			// When status = "accepted", backend returns AcceptedInterestResponse
			return result as AcceptedInterestResponse;
		} catch (err: unknown) {
			if (err instanceof ApiClientError) {
				if (err.status === 422) {
					toast.error(err.body.message || "Cannot accept this interest request");
				} else {
					toast.error(err.body.message || "Failed to accept");
				}
			} else {
				toast.error("Failed to accept interest");
			}
			throw err;
		}
	};

	const handleDecline = async (interestId: string) => {
		try {
			await updateInterestStatus(interestId, "declined");
			toast.success("Interest declined");
			setInterests((prev) => prev.filter((i) => i.interestRequestId !== interestId));
		} catch {
			toast.error("Failed to decline");
		}
	};

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={(o) => !o && onClose()}>
				<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Heart className="size-4 text-rose-500" />
							Interest Requests
						</DialogTitle>
						<DialogDescription className="line-clamp-1">{listingTitle}</DialogDescription>
					</DialogHeader>

					{/* Tab Toggle */}
					<div className="flex gap-1 p-1 bg-muted rounded-lg">
						<button
							onClick={() => setActiveTab("pending")}
							className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
								activeTab === "pending" ?
									"bg-background shadow-sm font-medium"
								:	"text-muted-foreground hover:text-foreground"
							}`}>
							Pending
						</button>
						<button
							onClick={() => setActiveTab("accepted")}
							className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
								activeTab === "accepted" ?
									"bg-background shadow-sm font-medium"
								:	"text-muted-foreground hover:text-foreground"
							}`}>
							Accepted
						</button>
					</div>

					{isLoading ?
						<div className="flex justify-center py-10">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					: interests.length === 0 ?
						<div className="text-center py-10">
							<Users className="size-8 text-muted-foreground mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">No {activeTab} interest requests</p>
						</div>
					:	<div className="space-y-3">
							{interests.map((interest) => (
								<Card
									key={interest.interestRequestId}
									className="cursor-pointer hover:shadow-sm transition-shadow"
									onClick={() => setSelectedInterest(interest)}>
									<CardContent className="p-4">
										<div className="flex items-start gap-3">
											<Avatar className="size-10 shrink-0">
												{interest.student.profilePhotoUrl && (
													<AvatarImage
														src={interest.student.profilePhotoUrl}
														alt={interest.student.fullName}
													/>
												)}
												<AvatarFallback className="bg-primary/10 text-primary font-semibold">
													{interest.student.fullName?.charAt(0)?.toUpperCase() ?? "?"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<div className="flex items-start justify-between gap-2">
													<p className="font-semibold text-sm">{interest.student.fullName}</p>
													<ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
												</div>
												{interest.student.averageRating > 0 && (
													<StarRating
														rating={interest.student.averageRating}
														size="sm"
													/>
												)}
												{interest.message && (
													<p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
														"{interest.message}"
													</p>
												)}
												<p className="text-xs text-muted-foreground mt-1">
													{formatDistanceToNow(new Date(interest.createdAt), {
														addSuffix: true,
													})}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					}
				</DialogContent>
			</Dialog>

			<StudentDetailModal
				interest={selectedInterest}
				open={!!selectedInterest}
				onClose={() => setSelectedInterest(null)}
				onAccept={handleAccept}
				onDecline={handleDecline}
			/>
		</>
	);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function ListingsPage() {
	const { property_id } = useSearch({ from: "/_auth/_pgowner/listings" });
	const [listings, setListings] = useState<ListingSearchItem[]>([]);
	const [properties, setProperties] = useState<PropertyListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [interestsPanelState, setInterestsPanelState] = useState<{
		listingId: string;
		listingTitle: string;
	} | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ListingSearchItem | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toggleLoading, setToggleLoading] = useState<string | null>(null);

	const getDefaultFormData = (propId?: string): ListingFormData => ({
		propertyId: propId || "",
		listingType: "pg_room",
		title: "",
		description: "",
		roomType: "single",
		totalCapacity: 1,
		rentPerMonth: 0,
		depositAmount: 0,
		availableFrom: new Date().toISOString().split("T")[0],
		rentIncludesUtilities: false,
		isNegotiable: false,
		amenityIds: [],
		preferences: [],
	});

	const [formData, setFormData] = useState<ListingFormData>(getDefaultFormData(property_id));

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (property_id) {
			setFormData((prev) => ({ ...prev, propertyId: property_id }));
		}
	}, [property_id]);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [listingsRes, propertiesRes] = await Promise.all([searchListings({ limit: 100 }), getMyProperties()]);
			setListings(listingsRes.items);
			setProperties(propertiesRes.items);
		} catch {
			toast.error("Failed to load data");
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenCreate = () => {
		if (properties.length === 0) {
			toast.error("Please add a property first before creating listings");
			return;
		}
		setFormData(getDefaultFormData(property_id || properties[0]?.property_id));
		setIsCreateOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.propertyId || !formData.availableFrom) {
			toast.error("Please fill in all required fields");
			return;
		}
		if (formData.rentPerMonth === undefined || formData.rentPerMonth === null) {
			toast.error("Monthly rent is required");
			return;
		}

		setIsSubmitting(true);
		try {
			await createListing({
				...(formData as CreateListingInput),
				depositAmount: formData.depositAmount ?? 0,
				rentIncludesUtilities: formData.rentIncludesUtilities ?? false,
				isNegotiable: formData.isNegotiable ?? false,
				amenityIds: formData.amenityIds,
				preferences: formData.preferences,
			});
			toast.success("Listing created successfully");
			setIsCreateOpen(false);
			fetchData();
		} catch (err: unknown) {
			if (err instanceof ApiClientError) {
				toast.error(err.body.message || "Failed to create listing");
			} else {
				toast.error("Failed to create listing");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteListing(deleteTarget.listing_id);
			toast.success("Listing deleted");
			setDeleteTarget(null);
			fetchData();
		} catch {
			toast.error("Failed to delete listing");
		}
	};

	const handleToggleStatus = async (listing: ListingSearchItem) => {
		const newStatus =
			listing.status === "active" ? "deactivated"
			: listing.status === "deactivated" ? "active"
			: null;

		if (!newStatus) {
			toast.error(`Cannot toggle a listing with status "${listing.status}"`);
			return;
		}

		setToggleLoading(listing.listing_id);
		try {
			await updateListingStatus(listing.listing_id, newStatus as "active" | "deactivated" | "filled");
			toast.success(`Listing ${newStatus === "active" ? "activated" : "deactivated"}`);
			fetchData();
		} catch (err: unknown) {
			if (err instanceof ApiClientError) {
				toast.error(err.body.message || "Failed to update status");
			} else {
				toast.error("Failed to update status");
			}
		} finally {
			setToggleLoading(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
					<p className="text-muted-foreground">Manage your room listings across all properties</p>
				</div>
				<Dialog
					open={isCreateOpen}
					onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button
							onClick={handleOpenCreate}
							disabled={properties.length === 0}>
							<Plus className="mr-2 h-4 w-4" />
							Add Listing
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Listing</DialogTitle>
							<DialogDescription>Add a new room listing to one of your properties</DialogDescription>
						</DialogHeader>
						<ListingForm
							formData={formData}
							onChange={setFormData}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
							properties={properties}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{listings.length === 0 ?
				<EmptyState
					icon={Bed}
					title="No listings yet"
					description={
						properties.length === 0 ?
							"Add a property first to start creating room listings."
						:	"Create your first room listing to start receiving interest from students."
					}
					action={
						properties.length > 0 ?
							{ label: "Create Your First Listing", onClick: handleOpenCreate }
						:	undefined
					}
				/>
			:	<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{listings.map((listing) => {
						const canToggle = listing.status === "active" || listing.status === "deactivated";
						return (
							<Card
								key={listing.listing_id}
								className="overflow-hidden transition-shadow hover:shadow-md">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
											<CardDescription className="text-xs mt-0.5">
												{listing.city}
												{listing.locality && `, ${listing.locality}`}
											</CardDescription>
										</div>
										<Badge
											variant={
												listing.status === "active" ? "success"
												: listing.status === "filled" ?
													"info"
												:	"secondary"
											}
											className="shrink-0">
											{listing.status}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="space-y-3">
									<div className="flex flex-wrap gap-1.5">
										<Badge
											variant="outline"
											className="text-xs">
											<Bed className="mr-1 h-3 w-3" />
											{listing.room_type.replace(/_/g, " ")}
										</Badge>
										{listing.preferred_gender &&
											listing.preferred_gender !== "prefer_not_to_say" && (
												<Badge
													variant="outline"
													className="text-xs">
													<Users className="mr-1 h-3 w-3" />
													{listing.preferred_gender}
												</Badge>
											)}
									</div>

									<div className="flex items-center text-primary font-bold">
										<IndianRupee className="h-4 w-4" />
										{formatCurrency(listing.rentPerMonth)}
										<span className="text-xs font-normal text-muted-foreground ml-0.5">/mo</span>
									</div>

									<Separator />

									<div className="flex items-center gap-1.5 flex-wrap">
										{/* View Interests */}
										<Button
											variant="outline"
											size="sm"
											className="h-8 text-xs flex-1 min-w-25"
											onClick={() =>
												setInterestsPanelState({
													listingId: listing.listing_id,
													listingTitle: listing.title,
												})
											}>
											<Heart className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
											Interests
										</Button>

										{/* Toggle Active/Deactivated */}
										{canToggle && (
											<Button
												variant="ghost"
												size="sm"
												className="h-8 px-2.5"
												onClick={() => handleToggleStatus(listing)}
												disabled={toggleLoading === listing.listing_id}
												title={
													listing.status === "active" ?
														"Deactivate listing"
													:	"Activate listing"
												}>
												{toggleLoading === listing.listing_id ?
													<Loader2 className="h-4 w-4 animate-spin" />
												: listing.status === "active" ?
													<ToggleRight className="h-4 w-4 text-emerald-600" />
												:	<ToggleLeft className="h-4 w-4 text-muted-foreground" />}
											</Button>
										)}

										{/* Delete */}
										<Button
											variant="ghost"
											size="sm"
											className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
											onClick={() => setDeleteTarget(listing)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			}

			{/* Interests Panel */}
			{interestsPanelState && (
				<InterestsPanelDialog
					listingId={interestsPanelState.listingId}
					listingTitle={interestsPanelState.listingTitle}
					open={true}
					onClose={() => setInterestsPanelState(null)}
					onDataChange={fetchData}
				/>
			)}

			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				title="Delete Listing"
				description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will expire all pending interest requests.`}
				confirmLabel="Delete"
				onConfirm={handleDelete}
				variant="destructive"
			/>
		</div>
	);
}
