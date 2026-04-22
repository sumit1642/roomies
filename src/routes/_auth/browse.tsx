// src/routes/_auth/browse.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { EmptyState } from "#/components/EmptyState";
import { StarRating } from "#/components/StarRating";
import { searchListings, saveListing, unsaveListing, getSavedListings } from "#/lib/api/listings";
import { formatCurrency } from "#/lib/format";
import type { ListingSearchItem, ListingFilters } from "#/types";
import { RoomType } from "#/types/enums";
import { toast } from "#/components/ui/sonner";
import { Search, Bed, MapPin, IndianRupee, Heart, Filter, X, Building2, Users, Loader2, Zap } from "lucide-react";
import type { Cursor } from "#/types";
import { useAuth } from "#/context/AuthContext";
import { cn } from "#/lib/utils";
import { ApiClientError } from "#/lib/api";

export const Route = createFileRoute("/_auth/browse")({
	component: BrowseListingsPage,
	validateSearch: (
		search: Record<string, unknown>,
	): {
		city?: string;
		room_type?: string;
		min_rent?: number;
		max_rent?: number;
		gender?: string;
	} => ({
		city: typeof search.city === "string" ? search.city : undefined,
		room_type: typeof search.room_type === "string" ? search.room_type : undefined,
		min_rent: typeof search.min_rent === "number" ? search.min_rent : undefined,
		max_rent: typeof search.max_rent === "number" ? search.max_rent : undefined,
		gender: typeof search.gender === "string" ? search.gender : undefined,
	}),
});

function CompatibilityBadge({ score, available }: { score: number; available: boolean }) {
	if (!available || score === 0) return null;
	// Max 7 preference categories
	const pct = Math.min(100, Math.round((score / 7) * 100));
	const color =
		pct >= 70 ?
			"text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800"
		: pct >= 40 ?
			"text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800"
		:	"text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-700";

	return (
		<div
			className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", color)}>
			<Zap className="size-3" />
			{score}/{7} match
		</div>
	);
}

function BrowseListingsPage() {
	const searchParams = Route.useSearch();
	const { role, isEmailVerified } = useAuth();
	const isStudent = role === "student";

	const [listings, setListings] = useState<ListingSearchItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	// Track saved listing IDs (loaded from backend on mount for students)
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
	const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
	const [savedLoaded, setSavedLoaded] = useState(false);

	const [filters, setFilters] = useState<ListingFilters>({
		city: searchParams.city || "",
		room_type: searchParams.room_type as ListingFilters["room_type"],
		min_rent: searchParams.min_rent,
		max_rent: searchParams.max_rent,
		gender_preference: searchParams.gender as ListingFilters["gender_preference"],
	});

	const [tempFilters, setTempFilters] = useState<ListingFilters>(filters);

	// Load saved listings once for students
	useEffect(() => {
		if (!isStudent || savedLoaded) return;
		getSavedListings()
			.then((res) => {
				setSavedIds(new Set(res.items.map((l) => l.listing_id)));
				setSavedLoaded(true);
			})
			.catch(() => {
				setSavedLoaded(true);
			});
	}, [isStudent, savedLoaded]);

	const fetchListings = useCallback(async (activeFilters: ListingFilters, cursor?: Cursor, append = false) => {
		try {
			if (!append) setIsLoading(true);
			else setIsLoadingMore(true);

			const res = await searchListings({
				city: activeFilters.city || undefined,
				roomType: activeFilters.room_type,
				minRent: activeFilters.min_rent,
				maxRent: activeFilters.max_rent,
				preferredGender: activeFilters.gender_preference,
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
	}, []);

	useEffect(() => {
		fetchListings(filters);
	}, [filters, fetchListings]);

	const handleLoadMore = () => {
		if (nextCursor) fetchListings(filters, nextCursor, true);
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

	const handleToggleSave = async (e: React.MouseEvent, listingId: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (savingIds.has(listingId)) return;

		// Require email verification to save
		if (!isEmailVerified) {
			toast.error("Please verify your email to save listings");
			return;
		}

		setSavingIds((prev) => new Set(prev).add(listingId));
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
				toast.success("Saved to favourites");
			}
		} catch (err) {
			if (err instanceof ApiClientError && err.status === 422) {
				toast.error("This listing is no longer available");
			} else {
				toast.error("Failed to update saved status");
			}
		} finally {
			setSavingIds((prev) => {
				const next = new Set(prev);
				next.delete(listingId);
				return next;
			});
		}
	};

	const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Browse Listings</h1>
				<p className="text-muted-foreground text-sm mt-1">
					Find your perfect PG, hostel, or shared room
					{isStudent && " — matched to your preferences"}
				</p>
			</div>

			{/* Search + Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by city..."
						value={tempFilters.city || ""}
						onChange={(e) => setTempFilters((prev) => ({ ...prev, city: e.target.value }))}
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
							className="ml-2 text-xs h-5 px-1.5">
							{activeFilterCount}
						</Badge>
					)}
				</Button>
				<Button onClick={handleApplyFilters}>Search</Button>
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
										setTempFilters((prev) => ({
											...prev,
											room_type:
												value === "all" ? undefined : (value as ListingFilters["room_type"]),
										}))
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
										setTempFilters((prev) => ({
											...prev,
											gender_preference:
												value === "all" ? undefined : (
													(value as ListingFilters["gender_preference"])
												),
										}))
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
									value={tempFilters.min_rent ?? ""}
									onChange={(e) =>
										setTempFilters((prev) => ({
											...prev,
											min_rent: e.target.value ? parseInt(e.target.value) : undefined,
										}))
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Max Rent (₹)</Label>
								<Input
									type="number"
									placeholder="Max"
									value={tempFilters.max_rent ?? ""}
									onChange={(e) =>
										setTempFilters((prev) => ({
											...prev,
											max_rent: e.target.value ? parseInt(e.target.value) : undefined,
										}))
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

			{/* Results */}
			{listings.length === 0 ?
				<EmptyState
					icon={Building2}
					title="No listings found"
					description="Try adjusting your filters or search criteria."
					action={activeFilterCount > 0 ? { label: "Clear Filters", onClick: handleClearFilters } : undefined}
				/>
			:	<>
					<p className="text-sm text-muted-foreground">
						Showing {listings.length} listing{listings.length !== 1 ? "s" : ""}
						{activeFilterCount > 0 && " (filtered)"}
					</p>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{listings.map((listing) => (
							<Card
								key={listing.listing_id}
								className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
								{/* Cover Photo */}
								{listing.cover_photo_url && !listing.cover_photo_url.startsWith("processing:") && (
									<div className="aspect-video bg-muted overflow-hidden relative">
										<img
											src={listing.cover_photo_url}
											alt={listing.title}
											className="w-full h-full object-cover"
										/>
										{/* Compatibility badge on photo */}
										{isStudent && listing.compatibilityAvailable && (
											<div className="absolute top-2 left-2">
												<CompatibilityBadge
													score={listing.compatibilityScore}
													available={listing.compatibilityAvailable}
												/>
											</div>
										)}
										{/* Save button on photo */}
										{isStudent && (
											<button
												onClick={(e) => handleToggleSave(e, listing.listing_id)}
												disabled={savingIds.has(listing.listing_id)}
												className={cn(
													"absolute top-2 right-2 size-8 flex items-center justify-center rounded-full shadow-md transition-all",
													savedIds.has(listing.listing_id) ? "bg-rose-500 text-white" : (
														"bg-white/90 text-slate-600 hover:bg-white"
													),
												)}>
												{savingIds.has(listing.listing_id) ?
													<Loader2 className="size-4 animate-spin" />
												:	<Heart
														className="size-4"
														fill={
															savedIds.has(listing.listing_id) ? "currentColor" : "none"
														}
													/>
												}
											</button>
										)}
									</div>
								)}

								<CardHeader className="pb-2 pt-4">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<Link
												to="/listing/$id"
												params={{ id: listing.listing_id }}>
												<CardTitle className="text-base line-clamp-1 hover:text-primary transition-colors cursor-pointer">
													{listing.title}
												</CardTitle>
											</Link>
											{listing.property_name && (
												<CardDescription className="flex items-center gap-1 mt-0.5 text-xs">
													<Building2 className="h-3 w-3" />
													{listing.property_name}
												</CardDescription>
											)}
										</div>
										{/* Save button for listings without photo */}
										{isStudent && !listing.cover_photo_url && (
											<Button
												variant="ghost"
												size="icon"
												className="shrink-0 size-8 -mt-1"
												onClick={(e) => handleToggleSave(e, listing.listing_id)}
												disabled={savingIds.has(listing.listing_id)}>
												{savingIds.has(listing.listing_id) ?
													<Loader2 className="size-4 animate-spin" />
												:	<Heart
														className="size-4"
														fill={
															savedIds.has(listing.listing_id) ? "currentColor" : "none"
														}
														strokeWidth={savedIds.has(listing.listing_id) ? 0 : 2}
														color={
															savedIds.has(listing.listing_id) ? "var(--destructive)" : (
																"currentColor"
															)
														}
													/>
												}
											</Button>
										)}
									</div>
								</CardHeader>

								<CardContent className="space-y-3 pt-0">
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<MapPin className="h-3.5 w-3.5 shrink-0" />
										{listing.city}
										{listing.locality && `, ${listing.locality}`}
									</div>

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
										{/* Compatibility badge for listings without photo */}
										{isStudent && listing.compatibilityAvailable && !listing.cover_photo_url && (
											<CompatibilityBadge
												score={listing.compatibilityScore}
												available={listing.compatibilityAvailable}
											/>
										)}
									</div>

									{listing.average_rating > 0 && (
										<StarRating
											rating={listing.average_rating}
											size="sm"
											showValue
										/>
									)}

									<div className="flex items-center justify-between pt-1 border-t">
										<div className="flex items-center text-primary font-bold">
											<IndianRupee className="h-3.5 w-3.5" />
											{formatCurrency(listing.rentPerMonth)}
											<span className="text-xs font-normal text-muted-foreground ml-0.5">
												/mo
											</span>
										</div>
										<Link
											to="/listing/$id"
											params={{ id: listing.listing_id }}>
											<Button
												size="sm"
												className="h-7 text-xs">
												View Details
											</Button>
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
