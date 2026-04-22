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
	Eye,
	Check,
	X,
	GraduationCap,
	Mail,
	Phone,
	Star,
	ChevronRight,
	Heart,
	MessageSquare,
} from "lucide-react";
import type { ListingSearchItem, PropertyListItem, InterestRequestWithStudent, PreferencePair } from "#/types";
import type { CreateListingInput } from "#/lib/api/listings";
import { formatDistanceToNow } from "date-fns";

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
							onChange({ ...formData, preferredGender: value as CreateListingInput["preferredGender"] })
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
							onChange({ ...formData, rentPerMonth: e.target.value ? Number(e.target.value) : undefined })
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

// ─── Student Detail Modal ─────────────────────────────────────────────────────
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
	onAccept: (id: string) => Promise<void>;
	onDecline: (id: string) => Promise<void>;
}) {
	const [isActing, setIsActing] = useState<"accept" | "decline" | null>(null);

	if (!interest) return null;

	const { student } = interest;
	const initial = student.fullName?.charAt(0)?.toUpperCase() ?? "?";

	const handleAccept = async () => {
		setIsActing("accept");
		try {
			await onAccept(interest.interestRequestId);
			onClose();
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

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Student Interest Request</DialogTitle>
					<DialogDescription>Review this student's profile and respond to their request</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Student Profile Header */}
					<div className="flex items-start gap-4 p-4 bg-muted/40 rounded-xl">
						<Avatar className="size-16 ring-2 ring-border">
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

					{/* Student Details */}
					<div className="space-y-3">
						<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
							Profile Details
						</h4>
						<div className="space-y-2">
							<DetailRow
								icon={GraduationCap}
								label="Role"
								value="Student"
							/>
							{student.averageRating > 0 && (
								<DetailRow
									icon={Star}
									label="Rating"
									value={`${student.averageRating.toFixed(1)} / 5.0`}
								/>
							)}
						</div>
					</div>

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

					{/* Request Info */}
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
			</DialogContent>
		</Dialog>
	);
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 text-sm">
			<Icon className="size-4 text-muted-foreground shrink-0" />
			<span className="text-muted-foreground w-20 shrink-0">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}

// ─── Interests Panel ──────────────────────────────────────────────────────────
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

	const handleAccept = async (interestId: string) => {
		try {
			await updateInterestStatus(interestId, "accepted");
			toast.success("Interest accepted! A connection has been created.");
			setInterests((prev) => prev.filter((i) => i.interestRequestId !== interestId));
			onDataChange();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Failed to accept";
			toast.error(msg);
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

// ─── Main Page ────────────────────────────────────────────────────────────────
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
			const msg = err instanceof Error ? err.message : "Failed to create listing";
			toast.error(msg);
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
			const msg = err instanceof Error ? err.message : "Failed to update status";
			toast.error(msg);
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
											className="h-8 text-xs flex-1 min-w-[100px]"
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
