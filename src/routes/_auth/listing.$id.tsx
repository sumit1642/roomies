// src/routes/_auth/listing.$id.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Separator } from "#/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { Label } from "#/components/ui/label";
import { StarRating } from "#/components/StarRating";
import { UserAvatar } from "#/components/UserAvatar";
import { getListing, saveListing, unsaveListing } from "#/lib/api/listings";
import { sendInterest } from "#/lib/api/interests";
import { getPublicPropertyRatings } from "#/lib/api/ratings";
import { formatCurrency, formatDate } from "#/lib/format";
import { useAuth } from "#/context/AuthContext";
import type { ListingDetail, PublicRating } from "#/types";
import { toast } from "#/components/ui/sonner";
import {
	ArrowLeft,
	Bed,
	MapPin,
	IndianRupee,
	Heart,
	Calendar,
	Users,
	Check,
	Building2,
	MessageCircle,
	Loader2,
	Hash,
	Zap,
	Star,
} from "lucide-react";
import { cn } from "#/lib/utils";
import { ApiClientError } from "#/lib/api";

export const Route = createFileRoute("/_auth/listing/$id")({
	component: ListingDetailPage,
});

// Compatibility meter shown only to students with set preferences
function CompatibilityMeter({ score, available }: { score: number; available: boolean }) {
	if (!available) {
		return (
			<div className="p-4 rounded-xl border border-dashed border-muted-foreground/30 text-center">
				<Zap className="size-5 text-muted-foreground mx-auto mb-1" />
				<p className="text-xs text-muted-foreground">
					Set your{" "}
					<a
						href="/preferences"
						className="underline text-primary">
						lifestyle preferences
					</a>{" "}
					to see compatibility score
				</p>
			</div>
		);
	}

	const pct = Math.min(100, Math.round((score / 7) * 100));
	const label =
		pct >= 70 ? "Great match"
		: pct >= 40 ? "Good match"
		: "Partial match";
	const color =
		pct >= 70 ? "text-emerald-600"
		: pct >= 40 ? "text-amber-600"
		: "text-slate-500";
	const barColor =
		pct >= 70 ? "bg-emerald-500"
		: pct >= 40 ? "bg-amber-500"
		: "bg-slate-400";

	return (
		<div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Zap className={cn("size-4", color)} />
					<span className="text-sm font-semibold">{label}</span>
				</div>
				<span className={cn("text-sm font-bold", color)}>{pct}%</span>
			</div>
			<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
				<div
					className={cn("h-full rounded-full transition-all", barColor)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="text-xs text-muted-foreground">{score} of 7 preferences match</p>
		</div>
	);
}

function ListingDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { user, role, isEmailVerified } = useAuth();
	const [listing, setListing] = useState<ListingDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [interestSent, setInterestSent] = useState(false);
	const [isSendingInterest, setIsSendingInterest] = useState(false);
	const [interestMessage, setInterestMessage] = useState("");
	const [interestDialogOpen, setInterestDialogOpen] = useState(false);
	const [propertyRatings, setPropertyRatings] = useState<PublicRating[]>([]);

	const isStudent = role === "student";

	useEffect(() => {
		async function fetchListing() {
			try {
				setIsLoading(true);
				const data = await getListing(id);
				setListing(data);
				if (data.property_id) {
					getPublicPropertyRatings(data.property_id)
						.then((r) => setPropertyRatings(r.items))
						.catch(() => {});
				}
			} catch {
				toast.error("Listing not found");
				navigate({ to: "/browse", search: {} });
			} finally {
				setIsLoading(false);
			}
		}
		fetchListing();
	}, [id, navigate]);

	const handleToggleSave = async () => {
		if (!listing) return;
		if (!isEmailVerified) {
			toast.error("Please verify your email to save listings");
			return;
		}
		setIsSaving(true);
		try {
			if (isSaved) {
				await unsaveListing(listing.listing_id);
				setIsSaved(false);
				toast.success("Removed from saved");
			} else {
				await saveListing(listing.listing_id);
				setIsSaved(true);
				toast.success("Saved to favourites");
			}
		} catch (err) {
			if (err instanceof ApiClientError && err.status === 422) {
				toast.error("This listing is no longer available");
			} else {
				toast.error("Failed to update saved status");
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleExpressInterest = async () => {
		if (!listing) return;
		if (!isEmailVerified) {
			toast.error("Please verify your email to send interest requests");
			return;
		}
		setIsSendingInterest(true);
		try {
			await sendInterest(listing.listing_id, interestMessage || undefined);
			toast.success("Interest sent! The owner will be notified.");
			setInterestSent(true);
			setInterestDialogOpen(false);
			setInterestMessage("");
		} catch (err: unknown) {
			if (err instanceof ApiClientError) {
				if (err.status === 409) {
					toast.error("You have already sent interest to this listing");
					setInterestSent(true);
				} else {
					toast.error(err.body.message || "Failed to send interest");
				}
			} else {
				toast.error("Failed to send interest");
			}
		} finally {
			setIsSendingInterest(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!listing) return null;

	const property = listing.property;

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<Button
				variant="ghost"
				onClick={() => navigate({ to: "/browse", search: {} })}
				className="mb-2">
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Listings
			</Button>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Photo Gallery */}
					{listing.photos &&
						listing.photos.filter((p) => !p.photoUrl.startsWith("processing:")).length > 0 && (
							<div className="grid gap-2 grid-cols-2">
								{listing.photos
									.filter((p) => !p.photoUrl.startsWith("processing:"))
									.slice(0, 4)
									.map((photo, idx) => (
										<img
											key={photo.photoId}
											src={photo.photoUrl}
											alt={`${listing.title} photo ${idx + 1}`}
											className={cn(
												"rounded-xl object-cover w-full",
												(
													idx === 0 &&
														listing.photos.filter(
															(p) => !p.photoUrl.startsWith("processing:"),
														).length > 1
												) ?
													"row-span-2 aspect-square"
												:	"aspect-video",
											)}
										/>
									))}
							</div>
						)}

					{/* Header Card */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between gap-3">
								<div className="flex-1 min-w-0">
									<h1 className="text-2xl font-bold">{listing.title}</h1>
									{property && (
										<p className="flex items-center gap-1.5 text-muted-foreground mt-1">
											<Building2 className="h-4 w-4 shrink-0" />
											{property.propertyName}
										</p>
									)}
									<p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
										<MapPin className="h-4 w-4 shrink-0" />
										{listing.city}
										{listing.locality && `, ${listing.locality}`}
										{listing.address_line && ` — ${listing.address_line}`}
									</p>
									{listing.pincode && (
										<p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
											<Hash className="h-3.5 w-3.5 shrink-0" />
											{listing.pincode}
										</p>
									)}
								</div>
								{isStudent && (
									<Button
										variant="ghost"
										size="icon"
										onClick={handleToggleSave}
										disabled={isSaving}
										className={isSaved ? "text-rose-500" : ""}>
										{isSaving ?
											<Loader2 className="h-5 w-5 animate-spin" />
										:	<Heart
												className="h-5 w-5"
												fill={isSaved ? "currentColor" : "none"}
											/>
										}
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-baseline gap-3 flex-wrap">
								<div className="flex items-center text-3xl font-bold text-primary">
									<IndianRupee className="h-6 w-6" />
									{formatCurrency(listing.rentPerMonth)}
									<span className="text-base font-normal text-muted-foreground">/month</span>
								</div>
								{listing.depositAmount > 0 && (
									<span className="text-sm text-muted-foreground">
										+ {formatCurrency(listing.depositAmount)} deposit
									</span>
								)}
							</div>

							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">
									<Bed className="mr-1.5 h-3.5 w-3.5" />
									{listing.room_type.replace(/_/g, " ")}
								</Badge>
								{listing.preferred_gender && (
									<Badge variant="outline">
										<Users className="mr-1.5 h-3.5 w-3.5" />
										{listing.preferred_gender === "prefer_not_to_say" ?
											"Any Gender"
										:	listing.preferred_gender}
									</Badge>
								)}
								<Badge variant="outline">
									<Calendar className="mr-1.5 h-3.5 w-3.5" />
									From {formatDate(listing.available_from)}
								</Badge>
								{listing.rent_includes_utilities && (
									<Badge variant="secondary">Utilities included</Badge>
								)}
								{listing.is_negotiable && <Badge variant="outline">Negotiable</Badge>}
								<Badge variant={listing.status === "active" ? "success" : "secondary"}>
									{listing.status}
								</Badge>
							</div>

							{/* Compatibility Score — students only */}
							{isStudent && (
								<CompatibilityMeter
									score={listing.compatibilityScore ?? 0}
									available={listing.compatibilityAvailable ?? false}
								/>
							)}
						</CardContent>
					</Card>

					{/* Description */}
					{listing.description && (
						<Card>
							<CardHeader>
								<CardTitle>About this space</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
									{listing.description}
								</p>
							</CardContent>
						</Card>
					)}

					{/* Amenities */}
					{listing.amenities && listing.amenities.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Amenities</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{listing.amenities.map((amenity) => (
										<div
											key={amenity.amenityId}
											className="flex items-center gap-2.5">
											<div className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
												<Check className="h-3 w-3 text-emerald-600" />
											</div>
											<span className="text-sm">{amenity.name}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Preferences */}
					{listing.preferences && listing.preferences.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Tenant Preferences</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{listing.preferences.map((pref) => (
										<Badge
											key={pref.preferenceKey}
											variant="outline"
											className="text-xs">
											{pref.preferenceKey.replace(/_/g, " ")}:{" "}
											<span className="ml-1 font-semibold">
												{pref.preferenceValue.replace(/_/g, " ")}
											</span>
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Property Info */}
					{property && (
						<Card>
							<CardHeader>
								<CardTitle>About the Property</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<p className="font-semibold">{property.propertyName}</p>
									<p className="text-sm text-muted-foreground">
										{property.addressLine}, {property.city}
										{property.locality && `, ${property.locality}`}
									</p>
								</div>
								{property.averageRating > 0 && (
									<div className="flex items-center gap-2">
										<StarRating
											rating={property.averageRating}
											size="sm"
											showValue
										/>
										<span className="text-xs text-muted-foreground">
											({property.ratingCount} reviews)
										</span>
									</div>
								)}
								{property.houseRules && (
									<div className="p-3 bg-muted/50 rounded-lg border border-border/50">
										<p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
											House Rules
										</p>
										<p className="text-sm whitespace-pre-wrap">{property.houseRules}</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Property Ratings */}
					{propertyRatings.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Star className="size-4 text-amber-500" />
									Property Reviews
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{propertyRatings.slice(0, 3).map((rating) => (
									<div
										key={rating.ratingId}
										className="space-y-1.5">
										<div className="flex items-center gap-2">
											<UserAvatar
												name={rating.reviewer.fullName}
												size="sm"
												photoUrl={rating.reviewer.profilePhotoUrl}
											/>
											<div>
												<p className="text-sm font-medium">{rating.reviewer.fullName}</p>
												<StarRating
													rating={rating.overallScore}
													size="sm"
												/>
											</div>
										</div>
										{rating.comment && (
											<p className="text-sm text-muted-foreground ml-9 line-clamp-2">
												{rating.comment}
											</p>
										)}
									</div>
								))}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Owner Card */}
					<Card>
						<CardHeader>
							<CardTitle>Posted By</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-3">
								<UserAvatar
									name={listing.poster_name || "Owner"}
									size="lg"
								/>
								<div>
									<p className="font-semibold">{listing.poster_name || "Property Owner"}</p>
									{listing.poster_rating > 0 && (
										<>
											<StarRating
												rating={listing.poster_rating}
												size="sm"
												showValue
											/>
											{listing.poster_rating_count > 0 && (
												<p className="text-xs text-muted-foreground">
													{listing.poster_rating_count} review
													{listing.poster_rating_count !== 1 ? "s" : ""}
												</p>
											)}
										</>
									)}
								</div>
							</div>

							{/* Interest Button — students only */}
							{isStudent && (
								<>
									{interestSent ?
										<div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
											<Check className="size-5 text-emerald-600 mx-auto mb-1" />
											<p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
												Interest Sent!
											</p>
											<p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
												Waiting for the owner to respond
											</p>
										</div>
									:	<Dialog
											open={interestDialogOpen}
											onOpenChange={setInterestDialogOpen}>
											<DialogTrigger asChild>
												<Button
													className="w-full"
													size="lg">
													<MessageCircle className="mr-2 h-4 w-4" />
													Express Interest
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Express Interest</DialogTitle>
													<DialogDescription>
														Introduce yourself to the owner. Add an optional message.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-3">
													<Label>Message (Optional)</Label>
													<Textarea
														value={interestMessage}
														onChange={(e) => setInterestMessage(e.target.value)}
														placeholder="Hi, I'm a 2nd year B.Tech student looking for a room from..."
														rows={4}
														maxLength={1000}
													/>
													<p className="text-xs text-muted-foreground text-right">
														{interestMessage.length}/1000
													</p>
												</div>
												<DialogFooter>
													<Button
														variant="outline"
														onClick={() => setInterestDialogOpen(false)}>
														Cancel
													</Button>
													<Button
														onClick={handleExpressInterest}
														disabled={isSendingInterest}>
														{isSendingInterest ?
															<>
																<Loader2 className="size-4 animate-spin mr-2" />
																Sending...
															</>
														:	"Send Interest"}
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									}
								</>
							)}
						</CardContent>
					</Card>

					{/* Pricing Details */}
					<Card>
						<CardHeader>
							<CardTitle>Pricing</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Monthly Rent</span>
								<span className="font-semibold">{formatCurrency(listing.rentPerMonth)}</span>
							</div>
							<Separator />
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Security Deposit</span>
								<span className="font-semibold">
									{listing.depositAmount > 0 ? formatCurrency(listing.depositAmount) : "None"}
								</span>
							</div>
							{listing.depositAmount > 0 && (
								<>
									<Separator />
									<div className="flex justify-between text-sm font-bold">
										<span>Total Move-in Cost</span>
										<span className="text-primary">
											{formatCurrency(listing.rentPerMonth + listing.depositAmount)}
										</span>
									</div>
								</>
							)}
							<div className="flex justify-between text-xs text-muted-foreground pt-1">
								<span>Occupancy</span>
								<span>
									{listing.current_occupants}/{listing.total_capacity} occupied
								</span>
							</div>
							{listing.bed_type && (
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>Bed Type</span>
									<span className="capitalize">{listing.bed_type.replace(/_/g, " ")}</span>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
