import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Bookmark, Trash2, MapPin, Calendar } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { toast } from "#/components/ui/sonner";
import { StatusBadge } from "#/components/StatusBadge";
import { StarRating } from "#/components/StarRating";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { getSavedListings, unsaveListing } from "#/lib/api/listings";
import { formatCurrency, formatRoomType, formatDate } from "#/lib/format";
import type { SavedListingItem, Cursor } from "#/types";

export const Route = createFileRoute("/_auth/_student/saved")({
	component: SavedListingsPage,
	head: () => ({
		meta: [{ title: "Saved Listings - Roomies" }],
	}),
});

function SavedListingsPage() {
	const [listings, setListings] = useState<SavedListingItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

	const fetchListings = async (cursor?: Cursor, append = false) => {
		try {
			const data = await getSavedListings(cursor);
			if (append) {
				setListings((prev) => [...prev, ...data.items]);
			} else {
				setListings(data.items);
			}
			setNextCursor(data.nextCursor);
		} catch {
			toast.error("Failed to load saved listings");
		}
	};

	useEffect(() => {
		fetchListings().finally(() => setIsLoading(false));
	}, []);

	const handleLoadMore = async (cursor: Cursor) => {
		setIsLoadingMore(true);
		await fetchListings(cursor, true);
		setIsLoadingMore(false);
	};

	const handleRemove = async (listingId: string) => {
		setRemovingId(listingId);
		try {
			await unsaveListing(listingId);
			setListings((prev) => prev.filter((l) => l.listing_id !== listingId));
			toast.success("Listing removed from saved");
		} catch {
			toast.error("Failed to remove listing");
		} finally {
			setRemovingId(null);
			setConfirmRemove(null);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Saved Listings</h1>
				<p className="mt-2 text-muted-foreground">Listings you&apos;ve saved for later</p>
			</div>

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

			<ConfirmDialog
				open={!!confirmRemove}
				onOpenChange={() => setConfirmRemove(null)}
				title="Remove from Saved?"
				description="This listing will be removed from your saved list."
				confirmLabel="Remove"
				onConfirm={() => confirmRemove && handleRemove(confirmRemove)}
			/>
		</div>
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
	// Filter out processing photos
	const photoUrl = listing.cover_photo_url?.startsWith("processing:") ? null : listing.cover_photo_url;

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
					<span className="text-lg font-bold text-primary">{formatCurrency(listing.rentPerMonth)}/mo</span>
					<span className="text-sm text-muted-foreground">{formatRoomType(listing.room_type)}</span>
				</div>

				<div className="mt-2 flex items-center justify-between text-sm">
					<div className="flex items-center gap-1 text-muted-foreground">
						<Calendar className="size-3" />
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
