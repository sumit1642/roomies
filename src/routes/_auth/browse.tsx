// src/routes/_auth/browse.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { EmptyState } from "#/components/EmptyState";
import { StarRating } from "#/components/StarRating";
import { searchListings, saveListing, unsaveListing } from "#/lib/api/listings";
import { formatCurrency } from "#/lib/format";
import type { ListingSearchItem, ListingFilters } from "#/types";
import { RoomType } from "#/types/enums";
import { toast } from "#/components/ui/sonner";
import { Search, Bed, MapPin, IndianRupee, Heart, Filter, X, Building2, Users, Loader2 } from "lucide-react";
import type { Cursor } from "#/types";

export const Route = createFileRoute("/_auth/browse")({
	component: BrowseListingsPage,
	validateSearch: (search: Record<string, unknown>) => ({
		city: search.city as string | undefined,
		room_type: search.room_type as string | undefined,
		min_rent: search.min_rent as number | undefined,
		max_rent: search.max_rent as number | undefined,
		gender: search.gender as string | undefined,
	}),
});

function BrowseListingsPage() {
	const searchParams = Route.useSearch();
	const [listings, setListings] = useState<ListingSearchItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

	const [filters, setFilters] = useState<ListingFilters>({
		city: searchParams.city || "",
		room_type: searchParams.room_type as ListingFilters["room_type"],
		min_rent: searchParams.min_rent,
		max_rent: searchParams.max_rent,
		gender_preference: searchParams.gender as ListingFilters["gender_preference"],
	});

	const [tempFilters, setTempFilters] = useState(filters);

	const fetchListings = async (cursor?: Cursor, append = false) => {
		try {
			if (!append) setIsLoading(true);
			else setIsLoadingMore(true);

			const res = await searchListings({
				city: filters.city || undefined,
				roomType: filters.room_type,
				minRent: filters.min_rent,
				maxRent: filters.max_rent,
				preferredGender: filters.gender_preference,
				limit: 20,
				cursorTime: cursor?.cursorTime,
				cursorId: cursor?.cursorId,
			});

			if (append) {
				setListings((prev) => [...prev, ...res.items]);
			} else {
				setListings(res.items);
			}
			setNextCursor(res.nextCursor);
		} catch {
			toast.error("Failed to load listings");
		} finally {
			setIsLoading(false);
			setIsLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchListings();
	}, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleLoadMore = () => {
		if (nextCursor) fetchListings(nextCursor, true);
	};

	const handleApplyFilters = () => {
		setFilters(tempFilters);
		setShowFilters(false);
	};

	const handleClearFilters = () => {
		const emptyFilters: ListingFilters = {};
		setTempFilters(emptyFilters);
		setFilters(emptyFilters);
		setShowFilters(false);
	};

	const handleToggleSave = async (listingId: string) => {
		try {
			if (savedIds.has(listingId)) {
				await unsaveListing(listingId);
				setSavedIds((prev) => {
					const next = new Set(prev);
					next.delete(listingId);
					return next;
				});
				toast.success("Removed from saved");
			} else {
				await saveListing(listingId);
				setSavedIds((prev) => new Set(prev).add(listingId));
				toast.success("Saved to favorites");
			}
		} catch {
			toast.error("Failed to update saved status");
		}
	};

	const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Browse Listings</h1>
				<p className="text-muted-foreground">Find your perfect PG accommodation</p>
			</div>

			{/* Search and Filters Bar */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by city..."
						value={tempFilters.city || ""}
						onChange={(e) => setTempFilters({ ...tempFilters, city: e.target.value })}
						onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
						className="pl-10"
					/>
				</div>
				<Button
					variant={showFilters ? "default" : "outline"}
					onClick={() => setShowFilters(!showFilters)}>
					<Filter className="mr-2 h-4 w-4" />
					Filters
					{activeFilterCount > 0 && (
						<Badge
							variant="secondary"
							className="ml-2">
							{activeFilterCount}
						</Badge>
					)}
				</Button>
			</div>

			{/* Filter Panel */}
			{showFilters && (
				<Card>
					<CardContent className="pt-6">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<Label>Room Type</Label>
								<Select
									value={tempFilters.room_type || "all"}
									onValueChange={(value) =>
										setTempFilters({
											...tempFilters,
											room_type:
												value === "all" ? undefined : (value as ListingFilters["room_type"]),
										})
									}>
									<SelectTrigger>
										<SelectValue placeholder="Any" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Any</SelectItem>
										<SelectItem value={RoomType.SINGLE}>Single</SelectItem>
										<SelectItem value={RoomType.DOUBLE}>Double</SelectItem>
										<SelectItem value={RoomType.TRIPLE}>Triple</SelectItem>
										<SelectItem value={RoomType.ENTIRE_FLAT}>Entire Flat</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Gender Preference</Label>
								<Select
									value={tempFilters.gender_preference || "all"}
									onValueChange={(value) =>
										setTempFilters({
											...tempFilters,
											gender_preference:
												value === "all" ? undefined : (
													(value as ListingFilters["gender_preference"])
												),
										})
									}>
									<SelectTrigger>
										<SelectValue placeholder="Any" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Any</SelectItem>
										<SelectItem value="male">Male</SelectItem>
										<SelectItem value="female">Female</SelectItem>
										<SelectItem value="other">Other</SelectItem>
										<SelectItem value="prefer_not_to_say">Any Gender</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Min Rent (₹)</Label>
								<Input
									type="number"
									placeholder="Min"
									value={tempFilters.min_rent || ""}
									onChange={(e) =>
										setTempFilters({
											...tempFilters,
											min_rent: e.target.value ? parseInt(e.target.value) : undefined,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Max Rent (₹)</Label>
								<Input
									type="number"
									placeholder="Max"
									value={tempFilters.max_rent || ""}
									onChange={(e) =>
										setTempFilters({
											...tempFilters,
											max_rent: e.target.value ? parseInt(e.target.value) : undefined,
										})
									}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2 mt-4">
							<Button
								variant="ghost"
								onClick={handleClearFilters}>
								<X className="mr-2 h-4 w-4" />
								Clear
							</Button>
							<Button onClick={handleApplyFilters}>Apply Filters</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Listings Grid */}
			{listings.length === 0 ?
				<EmptyState
					icon={Building2}
					title="No listings found"
					description="Try adjusting your filters or search criteria to find more listings."
					action={activeFilterCount > 0 ? { label: "Clear Filters", onClick: handleClearFilters } : undefined}
				/>
			:	<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{listings.map((listing) => (
							<Card
								key={listing.listingId}
								className="overflow-hidden hover:shadow-lg transition-shadow">
								{/* Cover photo */}
								{(listing.cover_photo_url || listing.coverPhotoUrl) && (
									<div className="aspect-video bg-muted overflow-hidden">
										<img
											src={(listing.cover_photo_url || listing.coverPhotoUrl) as string}
											alt={listing.title}
											className="w-full h-full object-cover"
										/>
									</div>
								)}
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<Link
												to="/listing/$id"
												params={{ id: listing.listingId }}>
												<CardTitle className="text-lg line-clamp-1 hover:text-primary transition-colors">
													{listing.title}
												</CardTitle>
											</Link>
											{listing.property_name && (
												<CardDescription className="flex items-center gap-1 mt-1">
													<Building2 className="h-3 w-3" />
													{listing.property_name}
												</CardDescription>
											)}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleToggleSave(listing.listingId)}
											className={savedIds.has(listing.listingId) ? "text-red-500" : ""}>
											<Heart
												className="h-5 w-5"
												fill={savedIds.has(listing.listingId) ? "currentColor" : "none"}
											/>
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<MapPin className="h-4 w-4" />
										{listing.city}
										{listing.locality && `, ${listing.locality}`}
									</div>

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

									{listing.average_rating !== undefined && listing.average_rating > 0 && (
										<StarRating
											rating={listing.average_rating}
											size="sm"
										/>
									)}

									<div className="flex items-center justify-between pt-2 border-t">
										<div className="flex items-center text-primary font-semibold text-lg">
											<IndianRupee className="h-4 w-4" />
											{formatCurrency(listing.rentPerMonth)}
											<span className="text-sm font-normal text-muted-foreground">/mo</span>
										</div>
										<Link
											to="/listing/$id"
											params={{ id: listing.listingId }}>
											<Button size="sm">View Details</Button>
										</Link>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{nextCursor && (
						<div className="flex justify-center pt-4">
							<Button
								variant="outline"
								onClick={handleLoadMore}
								disabled={isLoadingMore}>
								{isLoadingMore ?
									<>
										<Loader2 className="size-4 animate-spin mr-2" />
										Loading...
									</>
								:	"Load More"}
							</Button>
						</div>
					)}
				</>
			}
		</div>
	);
}
