// src/routes/_auth/_student/saved.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Bookmark, Trash2, MapPin, Calendar, Search, Plus, Pencil } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { toast } from "#/components/ui/sonner";
import { StatusBadge } from "#/components/StatusBadge";
import { StarRating } from "#/components/StarRating";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { unsaveListing } from "#/lib/api/listings";
import { createSavedSearch, deleteSavedSearch, listSavedSearches, updateSavedSearch } from "#/lib/api/savedSearches";
import { savedListingsInfiniteQueryOptions } from "#/lib/queryOptions";
import { queryKeys } from "#/lib/queryKeys";
import { formatCurrency, formatRoomType, formatDate } from "#/lib/format";
import type { SavedListingItem, Cursor, SavedSearch, RoomType, Gender, ListingType } from "#/types";

export const Route = createFileRoute("/_auth/_student/saved")({
	component: SavedListingsPage,
	head: () => ({
		meta: [{ title: "Saved Listings - Roomies" }],
	}),
});

function SavedListingsPage() {
	const qc = useQueryClient();
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
	const [searchDialogOpen, setSearchDialogOpen] = useState(false);
	const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
	const [deleteSearchTarget, setDeleteSearchTarget] = useState<SavedSearch | null>(null);

	const {
		data,
		isFetchingNextPage: isLoadingMore,
		fetchNextPage,
	} = useInfiniteQuery({
		...savedListingsInfiniteQueryOptions(),
	});

	const listings: SavedListingItem[] = data?.pages.flatMap((p) => p.items) ?? [];
	const lastPage = data?.pages[data.pages.length - 1];
	const nextCursor: Cursor | null = lastPage ? lastPage.nextCursor : null;

	const savedSearchesQuery = useQuery({
		queryKey: queryKeys.savedSearches(),
		queryFn: listSavedSearches,
	});

	const removeMutation = useMutation({
		mutationFn: (listingId: string) => unsaveListing(listingId),
		onSuccess: async (_data, listingId) => {
			qc.setQueryData(
				queryKeys.savedListings(),
				(
					old:
						| {
								pages: Array<{ items: SavedListingItem[]; nextCursor: Cursor | null }>;
								pageParams: unknown[];
						  }
						| undefined,
				) =>
					old ?
						{
							...old,
							pages: old.pages.map((page) => ({
								...page,
								items: page.items.filter((l) => l.listing_id !== listingId),
							})),
						}
					:	old,
			);
			await qc.invalidateQueries({ queryKey: queryKeys.savedListings() });
			toast.success("Listing removed from saved");
		},
		onError: () => {
			toast.error("Failed to remove listing");
		},
		onSettled: () => {
			setRemovingId(null);
			setConfirmRemove(null);
		},
	});

	const handleLoadMore = async (cursor: Cursor) => {
		void cursor;
		await fetchNextPage();
	};

	const handleRemove = async (listingId: string) => {
		setRemovingId(listingId);
		await removeMutation.mutateAsync(listingId);
	};

	return (
		<div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div>
					<h1 className="text-3xl font-bold">Saved</h1>
					<p className="mt-2 text-muted-foreground">Listings and searches you&apos;ve saved for later</p>
				</div>
				<Button
					onClick={() => {
						setEditingSearch(null);
						setSearchDialogOpen(true);
					}}>
					<Plus className="mr-2 size-4" />
					Save Search
				</Button>
			</div>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold">Saved Searches</h2>
					{savedSearchesQuery.isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
				</div>
				{(savedSearchesQuery.data ?? []).length === 0 ?
					<Card>
						<CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
							<Search className="size-4" />
							Save frequent browse filters so you can rerun them quickly.
						</CardContent>
					</Card>
				:	<div className="grid gap-3 sm:grid-cols-2">
						{(savedSearchesQuery.data ?? []).map((search) => (
							<SavedSearchCard
								key={search.searchId}
								search={search}
								onEdit={() => {
									setEditingSearch(search);
									setSearchDialogOpen(true);
								}}
								onDelete={() => setDeleteSearchTarget(search)}
							/>
						))}
					</div>
				}
			</section>

			<section className="space-y-3">
				<h2 className="text-xl font-semibold">Saved Listings</h2>
			{listings.length === 0 ?
				<EmptyState
					icon={Bookmark}
					title="No saved listings"
					description="Save listings you're interested in to view them here later"
					action={{ label: "Browse Listings", href: "/browse" }}
				/>
			:	<>
					<div className="grid gap-4 sm:grid-cols-2">
						{listings.map((listing) => (
							<SavedListingCard
								key={listing.listing_id}
								listing={listing}
								onRemove={() => setConfirmRemove(listing.listing_id)}
								isRemoving={removingId === listing.listing_id}
							/>
						))}
					</div>
					<LoadMoreButton
						nextCursor={nextCursor}
						isLoading={isLoadingMore}
						onLoadMore={handleLoadMore}
					/>
				</>
			}
			</section>

			<ConfirmDialog
				open={!!confirmRemove}
				onOpenChange={() => setConfirmRemove(null)}
				title="Remove from Saved?"
				description="This listing will be removed from your saved list."
				confirmLabel="Remove"
				onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
			/>

			<SavedSearchDialog
				open={searchDialogOpen}
				search={editingSearch}
				onOpenChange={(open) => {
					setSearchDialogOpen(open);
					if (!open) setEditingSearch(null);
				}}
				onSaved={async () => {
					await qc.invalidateQueries({ queryKey: queryKeys.savedSearches() });
				}}
			/>

			<ConfirmDialog
				open={!!deleteSearchTarget}
				onOpenChange={() => setDeleteSearchTarget(null)}
				title="Delete Saved Search?"
				description={`"${deleteSearchTarget?.name}" will be removed from your saved searches.`}
				confirmLabel="Delete"
				onConfirm={async () => {
					if (!deleteSearchTarget) return;
					await deleteSavedSearch(deleteSearchTarget.searchId);
					await qc.invalidateQueries({ queryKey: queryKeys.savedSearches() });
					setDeleteSearchTarget(null);
					toast.success("Saved search deleted");
				}}
				variant="destructive"
			/>
		</div>
	);
}

interface SavedSearchForm {
	name: string;
	city: string;
	minRent: string;
	maxRent: string;
	roomType: RoomType | "";
	bedType: string;
	preferredGender: Gender | "";
	listingType: ListingType | "";
	availableFrom: string;
}

const emptySearchForm: SavedSearchForm = {
	name: "",
	city: "",
	minRent: "",
	maxRent: "",
	roomType: "",
	bedType: "",
	preferredGender: "",
	listingType: "",
	availableFrom: "",
};

function formFromSavedSearch(search: SavedSearch | null): SavedSearchForm {
	if (!search) return emptySearchForm;
	const filters = search.filters;
	return {
		name: search.name,
		city: typeof filters.city === "string" ? filters.city : "",
		minRent: typeof filters.minRent === "number" ? String(filters.minRent) : "",
		maxRent: typeof filters.maxRent === "number" ? String(filters.maxRent) : "",
		roomType: (typeof filters.roomType === "string" ? filters.roomType : "") as RoomType | "",
		bedType: typeof filters.bedType === "string" ? filters.bedType : "",
		preferredGender: (typeof filters.preferredGender === "string" ? filters.preferredGender : "") as Gender | "",
		listingType: (typeof filters.listingType === "string" ? filters.listingType : "") as ListingType | "",
		availableFrom: typeof filters.availableFrom === "string" ? filters.availableFrom : "",
	};
}

function filtersFromForm(form: SavedSearchForm): Record<string, unknown> {
	const filters: Record<string, unknown> = {};
	if (form.city.trim()) filters.city = form.city.trim();
	if (form.minRent) filters.minRent = Number(form.minRent);
	if (form.maxRent) filters.maxRent = Number(form.maxRent);
	if (form.roomType) filters.roomType = form.roomType;
	if (form.bedType) filters.bedType = form.bedType;
	if (form.preferredGender) filters.preferredGender = form.preferredGender;
	if (form.listingType) filters.listingType = form.listingType;
	if (form.availableFrom) filters.availableFrom = form.availableFrom;
	return filters;
}

function SavedSearchDialog({
	open,
	search,
	onOpenChange,
	onSaved,
}: {
	open: boolean;
	search: SavedSearch | null;
	onOpenChange: (open: boolean) => void;
	onSaved: () => Promise<void>;
}) {
	const [form, setForm] = useState<SavedSearchForm>(formFromSavedSearch(search));
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) setForm(formFromSavedSearch(search));
	}, [open, search]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.name.trim()) {
			toast.error("Search name is required");
			return;
		}
		setIsSaving(true);
		try {
			const payload = { name: form.name.trim(), filters: filtersFromForm(form) };
			if (search) await updateSavedSearch(search.searchId, payload);
			else await createSavedSearch(payload);
			await onSaved();
			toast.success(search ? "Saved search updated" : "Saved search created");
			onOpenChange(false);
			setForm(emptySearchForm);
		} catch {
			toast.error("Failed to save search");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (nextOpen) setForm(formFromSavedSearch(search));
				onOpenChange(nextOpen);
			}}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{search ? "Edit Saved Search" : "Save Search"}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={handleSubmit}
					className="space-y-4">
					<div className="space-y-2">
						<Label>Name</Label>
						<Input
							value={form.name}
							onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
							placeholder="Near campus under 10k"
							required
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>City</Label>
							<Input
								value={form.city}
								onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
								placeholder="Pune"
							/>
						</div>
						<div className="space-y-2">
							<Label>Room Type</Label>
							<Select
								value={form.roomType || "any"}
								onValueChange={(value) =>
									setForm((prev) => ({ ...prev, roomType: value === "any" ? "" : (value as RoomType) }))
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="any">Any</SelectItem>
									<SelectItem value="single">Single</SelectItem>
									<SelectItem value="double">Double</SelectItem>
									<SelectItem value="triple">Triple</SelectItem>
									<SelectItem value="entire_flat">Entire flat</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Min Rent</Label>
							<Input
								type="number"
								min="0"
								value={form.minRent}
								onChange={(e) => setForm((prev) => ({ ...prev, minRent: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label>Max Rent</Label>
							<Input
								type="number"
								min="0"
								value={form.maxRent}
								onChange={(e) => setForm((prev) => ({ ...prev, maxRent: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label>Listing Type</Label>
							<Select
								value={form.listingType || "any"}
								onValueChange={(value) =>
									setForm((prev) => ({
										...prev,
										listingType: value === "any" ? "" : (value as ListingType),
									}))
								}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="any">Any</SelectItem>
									<SelectItem value="student_room">Student room</SelectItem>
									<SelectItem value="pg_room">PG room</SelectItem>
									<SelectItem value="hostel_bed">Hostel bed</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Available From</Label>
							<Input
								type="date"
								value={form.availableFrom}
								onChange={(e) => setForm((prev) => ({ ...prev, availableFrom: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSaving}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSaving}>
							{isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
							{search ? "Update" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function SavedSearchCard({
	search,
	onEdit,
	onDelete,
}: {
	search: SavedSearch;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const params = {
		city: typeof search.filters.city === "string" ? search.filters.city : undefined,
		room_type: typeof search.filters.roomType === "string" ? search.filters.roomType : undefined,
		min_rent: typeof search.filters.minRent === "number" ? search.filters.minRent : undefined,
		max_rent: typeof search.filters.maxRent === "number" ? search.filters.maxRent : undefined,
		gender: typeof search.filters.preferredGender === "string" ? search.filters.preferredGender : undefined,
	};
	const chips = Object.entries(search.filters).filter(([, value]) => value !== undefined && value !== "");

	return (
		<Card>
			<CardContent className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h3 className="font-semibold line-clamp-1">{search.name}</h3>
						<p className="text-xs text-muted-foreground">
							Saved {new Date(search.createdAt).toLocaleDateString("en-IN")}
						</p>
					</div>
					<div className="flex">
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={onDelete}>
							<Trash2 className="size-4 text-destructive" />
						</Button>
					</div>
				</div>
				<div className="flex flex-wrap gap-1">
					{chips.length === 0 ?
						<span className="text-xs text-muted-foreground">No filters</span>
					:	chips.slice(0, 4).map(([key, value]) => (
							<span
								key={key}
								className="rounded-md bg-muted px-2 py-1 text-xs">
								{String(key)}: {String(value).replace(/_/g, " ")}
							</span>
						))
					}
				</div>
				<Button
					variant="outline"
					size="sm"
					asChild
					className="w-full">
					<Link
						to="/browse"
						search={params}>
						<Search className="mr-2 size-4" />
						Run Search
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function SavedListingCard({
	listing,
	onRemove,
	isRemoving,
}: {
	listing: SavedListingItem;
	onRemove: () => void;
	isRemoving: boolean;
}) {
	// Filter out processing placeholder photos
	const photoUrl =
		listing.cover_photo_url && !listing.cover_photo_url.startsWith("processing:") ? listing.cover_photo_url : null;

	return (
		<Card className="overflow-hidden">
			<Link
				to="/listing/$id"
				params={{ id: listing.listing_id }}
				className="block">
				{/* Photo */}
				<div className="aspect-video bg-muted relative">
					{photoUrl ?
						<img
							src={photoUrl}
							alt={listing.title}
							className="object-cover w-full h-full"
						/>
					:	<div className="flex items-center justify-center h-full text-muted-foreground">No photo</div>}
					<div className="absolute top-2 right-2">
						{/* status is snake_case but the value itself matches the StatusBadge union */}
						<StatusBadge status={listing.status} />
					</div>
				</div>
			</Link>

			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-2">
					<Link
						to="/listing/$id"
						params={{ id: listing.listing_id }}
						className="flex-1 min-w-0">
						<h3 className="font-semibold line-clamp-1 hover:underline">{listing.title}</h3>
					</Link>
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 -mt-1 -mr-2"
						onClick={(e) => {
							e.preventDefault();
							onRemove();
						}}
						disabled={isRemoving}>
						{isRemoving ?
							<Loader2 className="size-4 animate-spin" />
						:	<Trash2 className="size-4 text-muted-foreground hover:text-destructive" />}
					</Button>
				</div>

				<div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
					<MapPin className="size-3" />
					<span>{listing.city}</span>
					{listing.locality && <span>&bull; {listing.locality}</span>}
				</div>

				<div className="mt-2 flex items-center justify-between">
					{/* rentPerMonth is camelCase (transformed by backend toRupees()) */}
					<span className="text-lg font-bold text-primary">{formatCurrency(listing.rentPerMonth)}/mo</span>
					{/* room_type is snake_case */}
					<span className="text-sm text-muted-foreground">{formatRoomType(listing.room_type)}</span>
				</div>

				<div className="mt-2 flex items-center justify-between text-sm">
					<div className="flex items-center gap-1 text-muted-foreground">
						<Calendar className="size-3" />
						{/* available_from is snake_case */}
						<span>From {formatDate(listing.available_from)}</span>
					</div>
					{listing.average_rating > 0 && (
						<StarRating
							rating={listing.average_rating}
							size="sm"
						/>
					)}
				</div>

				{listing.property_name && <p className="mt-2 text-xs text-muted-foreground">{listing.property_name}</p>}
			</CardContent>
		</Card>
	);
}
