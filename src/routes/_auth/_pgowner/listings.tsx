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
import { EmptyState } from "#/components/EmptyState";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { searchListings, createListing, updateListingStatus, deleteListing } from "#/lib/api/listings";
import { getMyProperties } from "#/lib/api/properties";
import { getListingInterests, updateInterestStatus } from "#/lib/api/interests";
import { formatCurrency } from "#/lib/format";
import { toast } from "#/components/ui/sonner";
import { Plus, Bed, IndianRupee, Edit, Trash2, ToggleLeft, ToggleRight, Users, Loader2, Eye } from "lucide-react";
import type { ListingSearchItem, PropertyListItem, InterestRequestWithStudent } from "#/types";
import type { CreateListingInput } from "#/lib/api/listings";

export const Route = createFileRoute("/_auth/_pgowner/listings")({
	component: ListingsPage,
	validateSearch: (search: Record<string, unknown>) => ({
		property_id: search.property_id as string | undefined,
	}),
});

function ListingsPage() {
	const { property_id } = useSearch({ from: "/_auth/_pgowner/listings" });
	const [listings, setListings] = useState<ListingSearchItem[]>([]);
	const [properties, setProperties] = useState<PropertyListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [viewInterestsListingId, setViewInterestsListingId] = useState<string | null>(null);
	const [interests, setInterests] = useState<InterestRequestWithStudent[]>([]);
	const [interestsLoading, setInterestsLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<ListingSearchItem | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>(property_id || "all");

	const [formData, setFormData] = useState<Partial<CreateListingInput>>({
		propertyId: property_id || "",
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

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (property_id) {
			setSelectedPropertyFilter(property_id);
			setFormData((prev) => ({ ...prev, propertyId: property_id }));
		}
	}, [property_id]);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [listingsRes, propertiesRes] = await Promise.all([
				searchListings({ listingType: "pg_room", limit: 100 }),
				getMyProperties(),
			]);
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
		setFormData({
			propertyId: property_id || (properties[0]?.property_id ?? ""),
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
		setIsCreateOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.propertyId || !formData.availableFrom) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			await createListing(formData as CreateListingInput);
			toast.success("Listing created successfully");
			setIsCreateOpen(false);
			fetchData();
		} catch {
			toast.error("Failed to create listing");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteListing(deleteTarget.listingId);
			toast.success("Listing deleted");
			setDeleteTarget(null);
			fetchData();
		} catch {
			toast.error("Failed to delete listing");
		}
	};

	const handleToggleStatus = async (listing: ListingSearchItem) => {
		const newStatus = listing.status === "active" ? "deactivated" : "active";
		try {
			await updateListingStatus(listing.listingId, newStatus as "active" | "deactivated");
			toast.success(`Listing ${newStatus === "active" ? "activated" : "deactivated"}`);
			fetchData();
		} catch {
			toast.error("Failed to update status");
		}
	};

	const handleViewInterests = async (listingId: string) => {
		setViewInterestsListingId(listingId);
		setInterestsLoading(true);
		try {
			const res = await getListingInterests(listingId, "pending");
			setInterests(res.items);
		} catch {
			toast.error("Failed to load interests");
		} finally {
			setInterestsLoading(false);
		}
	};

	const handleAcceptInterest = async (interestId: string) => {
		try {
			await updateInterestStatus(interestId, "accepted");
			toast.success("Interest accepted! A connection has been created.");
			setInterests((prev) => prev.filter((i) => i.interestRequestId !== interestId));
		} catch {
			toast.error("Failed to accept interest");
		}
	};

	const handleDeclineInterest = async (interestId: string) => {
		try {
			await updateInterestStatus(interestId, "declined");
			toast.success("Interest declined");
			setInterests((prev) => prev.filter((i) => i.interestRequestId !== interestId));
		} catch {
			toast.error("Failed to decline interest");
		}
	};

	const filteredListings =
		selectedPropertyFilter === "all" ? listings : (
			listings.filter((l) => {
				// ListingSearchItem doesn't have property_id, filter by checking against property names
				return true; // Show all when we can't filter by property_id in search results
			})
		);

	const getPropertyName = (propertyId: string) => {
		return properties.find((p) => p.property_id === propertyId)?.property_name || "Unknown Property";
	};

	const ListingForm = () => (
		<form
			onSubmit={handleSubmit}
			className="space-y-4">
			<div className="space-y-2">
				<Label>Property *</Label>
				<Select
					value={formData.propertyId || ""}
					onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
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
						setFormData({ ...formData, listingType: value as CreateListingInput["listingType"] })
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
				<Label htmlFor="title">Title *</Label>
				<Input
					id="title"
					value={formData.title || ""}
					onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
							setFormData({ ...formData, roomType: value as CreateListingInput["roomType"] })
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
							setFormData({
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
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="rentPerMonth">Monthly Rent (₹) *</Label>
					<Input
						id="rentPerMonth"
						type="number"
						value={formData.rentPerMonth || ""}
						onChange={(e) => setFormData({ ...formData, rentPerMonth: Number(e.target.value) })}
						placeholder="e.g., 8000"
						min="0"
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="depositAmount">Deposit (₹)</Label>
					<Input
						id="depositAmount"
						type="number"
						value={formData.depositAmount || ""}
						onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
						placeholder="e.g., 16000"
						min="0"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="totalCapacity">Capacity</Label>
					<Input
						id="totalCapacity"
						type="number"
						value={formData.totalCapacity || 1}
						onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
						min="1"
						max="20"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="availableFrom">Available From *</Label>
					<Input
						id="availableFrom"
						type="date"
						value={formData.availableFrom || ""}
						onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
						required
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description || ""}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					placeholder="Describe the room features, rules, etc."
					rows={3}
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
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
						<ListingForm />
					</DialogContent>
				</Dialog>
			</div>

			{/* Interests Dialog */}
			<Dialog
				open={!!viewInterestsListingId}
				onOpenChange={(open) => !open && setViewInterestsListingId(null)}>
				<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Interest Requests</DialogTitle>
						<DialogDescription>Students who expressed interest in this listing</DialogDescription>
					</DialogHeader>
					{interestsLoading ?
						<div className="flex justify-center py-8">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					: interests.length === 0 ?
						<p className="text-center text-muted-foreground py-8">No pending interests</p>
					:	<div className="space-y-3">
							{interests.map((interest) => (
								<Card key={interest.interestRequestId}>
									<CardContent className="p-4">
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="font-medium">{interest.student.fullName}</p>
												{interest.message && (
													<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
														&ldquo;{interest.message}&rdquo;
													</p>
												)}
											</div>
											<div className="flex gap-2 shrink-0">
												<Button
													size="sm"
													onClick={() => handleAcceptInterest(interest.interestRequestId)}>
													Accept
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleDeclineInterest(interest.interestRequestId)}>
													Decline
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					}
				</DialogContent>
			</Dialog>

			{filteredListings.length === 0 ?
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
					{filteredListings.map((listing) => (
						<Card
							key={listing.listingId}
							className="overflow-hidden">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
									<Badge variant={listing.status === "active" ? "success" : "secondary"}>
										{listing.status}
									</Badge>
								</div>
								<CardDescription>
									{listing.city}
									{listing.locality && `, ${listing.locality}`}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">
										<Bed className="mr-1 h-3 w-3" />
										{listing.roomType.replace("_", " ")}
									</Badge>
									{listing.preferredGender && listing.preferredGender !== "prefer_not_to_say" && (
										<Badge variant="outline">
											<Users className="mr-1 h-3 w-3" />
											{listing.preferredGender}
										</Badge>
									)}
								</div>

								<div className="flex items-center text-primary font-semibold">
									<IndianRupee className="h-4 w-4" />
									{formatCurrency(listing.rentPerMonth)}/mo
								</div>

								<div className="flex items-center gap-2 pt-2 border-t">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleViewInterests(listing.listingId)}
										className="flex-1">
										<Eye className="mr-1 h-4 w-4" />
										Interests
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleToggleStatus(listing)}>
										{listing.status === "active" ?
											<ToggleRight className="h-4 w-4" />
										:	<ToggleLeft className="h-4 w-4" />}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setDeleteTarget(listing)}
										className="text-destructive hover:text-destructive">
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			}

			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				title="Delete Listing"
				description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
				confirmLabel="Delete"
				onConfirm={handleDelete}
				variant="destructive"
			/>
		</div>
	);
}
