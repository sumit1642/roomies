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
import { formatCurrency, formatDate } from "#/lib/format";
import { useAuth } from "#/context/AuthContext";
import type { ListingDetail } from "#/types";
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
} from "lucide-react";

export const Route = createFileRoute("/_auth/listing/$id")({
	component: ListingDetailPage,
});

function ListingDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [listing, setListing] = useState<ListingDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaved, setIsSaved] = useState(false);
	const [interestSent, setInterestSent] = useState(false);
	const [isSendingInterest, setIsSendingInterest] = useState(false);
	const [interestMessage, setInterestMessage] = useState("");
	const [interestDialogOpen, setInterestDialogOpen] = useState(false);

	const isStudent = user?.roles?.includes("student");

	useEffect(() => {
		async function fetchListing() {
			try {
				setIsLoading(true);
				const data = await getListing(id);
				setListing(data);
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
		try {
			if (isSaved) {
				// listing_id is snake_case from backend
				await unsaveListing(listing.listing_id);
				setIsSaved(false);
				toast.success("Removed from saved");
			} else {
				await saveListing(listing.listing_id);
				setIsSaved(true);
				toast.success("Saved to favorites");
			}
		} catch {
			toast.error("Failed to update saved status");
		}
	};

	const handleExpressInterest = async () => {
		if (!listing) return;
		setIsSendingInterest(true);
		try {
			await sendInterest(listing.listing_id, interestMessage || undefined);
			toast.success("Interest sent! The owner will be notified.");
			setInterestSent(true);
			setInterestDialogOpen(false);
			setInterestMessage("");
		} catch {
			toast.error("Failed to send interest. You may have already sent one.");
		} finally {
			setIsSendingInterest(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
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
				onClick={() => navigate({ to: "/browse", search: {} })}>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Listings
			</Button>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Photos — photoUrl is camelCase (from JSONB_BUILD_OBJECT in fetchListingDetail) */}
					{listing.photos && listing.photos.length > 0 && (
						<div className="grid gap-2 grid-cols-2">
							{listing.photos
								.filter((p) => !p.photoUrl.startsWith("processing:"))
								.slice(0, 4)
								.map((photo) => (
									<img
										key={photo.photoId}
										src={photo.photoUrl}
										alt={listing.title}
										className="rounded-lg object-cover aspect-video w-full"
									/>
								))}
						</div>
					)}

					{/* Header */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<h1 className="text-2xl font-bold">{listing.title}</h1>
									{/* property fields are camelCase (from JSONB_BUILD_OBJECT) */}
									{property && (
										<p className="flex items-center gap-1 text-muted-foreground mt-1">
											<Building2 className="h-4 w-4 shrink-0" />
											{property.propertyName}
										</p>
									)}
									{/* city/locality/address_line are snake_case (raw pg columns) */}
									<p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
										<MapPin className="h-4 w-4 shrink-0" />
										{listing.city}
										{listing.locality && `, ${listing.locality}`}
										{listing.address_line && ` — ${listing.address_line}`}
									</p>
									{listing.pincode && (
										<p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
											<Hash className="h-3 w-3 shrink-0" />
											{listing.pincode}
										</p>
									)}
								</div>
								{isStudent && (
									<Button
										variant="ghost"
										size="icon"
										onClick={handleToggleSave}
										className={isSaved ? "text-red-500" : ""}>
										<Heart
											className="h-6 w-6"
											fill={isSaved ? "currentColor" : "none"}
										/>
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4 mb-4">
								{/* rentPerMonth is camelCase (toRupees transformation) */}
								<div className="flex items-center text-2xl font-bold text-primary">
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
								{/* room_type is snake_case */}
								<Badge variant="outline">
									<Bed className="mr-1 h-4 w-4" />
									{listing.room_type.replace(/_/g, " ")}
								</Badge>
								{/* preferred_gender is snake_case */}
								{listing.preferred_gender && (
									<Badge variant="outline">
										<Users className="mr-1 h-4 w-4" />
										{listing.preferred_gender === "prefer_not_to_say" ?
											"Any Gender"
										:	listing.preferred_gender}
									</Badge>
								)}
								{/* available_from is snake_case */}
								<Badge variant="outline">
									<Calendar className="mr-1 h-4 w-4" />
									From {formatDate(listing.available_from)}
								</Badge>
								{/* rent_includes_utilities is snake_case */}
								{listing.rent_includes_utilities && (
									<Badge variant="secondary">Utilities included</Badge>
								)}
								{/* is_negotiable is snake_case */}
								{listing.is_negotiable && <Badge variant="outline">Negotiable</Badge>}
								<Badge variant={listing.status === "active" ? "success" : "secondary"}>
									{listing.status}
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Description */}
					{listing.description && (
						<Card>
							<CardHeader>
								<CardTitle>Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
							</CardContent>
						</Card>
					)}

					{/* Amenities — from JSONB_BUILD_OBJECT, keys are camelCase */}
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
											className="flex items-center gap-2">
											<Check className="h-4 w-4 text-green-500 shrink-0" />
											<span className="text-sm">{amenity.name}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Preferences — from JSONB_BUILD_OBJECT, keys are camelCase */}
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
											variant="outline">
											{pref.preferenceKey.replace(/_/g, " ")}:{" "}
											{pref.preferenceValue.replace(/_/g, " ")}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Property details — property summary uses camelCase (JSONB_BUILD_OBJECT) */}
					{property && (
						<Card>
							<CardHeader>
								<CardTitle>Property Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p className="text-sm font-medium">{property.propertyName}</p>
								<p className="text-sm text-muted-foreground">
									{property.addressLine}, {property.city}
									{property.locality && `, ${property.locality}`}
								</p>
								{property.houseRules && (
									<div className="mt-3">
										<p className="text-sm font-medium mb-1">House Rules</p>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap">
											{property.houseRules}
										</p>
									</div>
								)}
								{property.averageRating > 0 && (
									<div className="flex items-center gap-2 mt-2">
										<StarRating
											rating={property.averageRating}
											size="sm"
											showValue
										/>
										<span className="text-sm text-muted-foreground">
											({property.ratingCount} reviews)
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Poster / Owner Card — poster_rating, poster_name are snake_case */}
					<Card>
						<CardHeader>
							<CardTitle>Posted By</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3 mb-4">
								<UserAvatar
									name={listing.poster_name || "Owner"}
									size="lg"
								/>
								<div>
									<p className="font-medium">{listing.poster_name || "Property Owner"}</p>
									{listing.poster_rating > 0 && (
										<StarRating
											rating={listing.poster_rating}
											size="sm"
											showValue
										/>
									)}
									{listing.poster_rating_count > 0 && (
										<p className="text-xs text-muted-foreground">
											{listing.poster_rating_count} review
											{listing.poster_rating_count !== 1 ? "s" : ""}
										</p>
									)}
								</div>
							</div>

							{isStudent && (
								<>
									{interestSent ?
										<div className="p-3 bg-muted rounded-lg text-center">
											<p className="text-sm font-medium text-green-600">Interest sent!</p>
											<p className="text-xs text-muted-foreground mt-1">
												Waiting for the owner to respond
											</p>
										</div>
									:	<Dialog
											open={interestDialogOpen}
											onOpenChange={setInterestDialogOpen}>
											<DialogTrigger asChild>
												<Button className="w-full">
													<MessageCircle className="mr-2 h-4 w-4" />
													Express Interest
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Express Interest</DialogTitle>
													<DialogDescription>
														Let the owner know you&apos;re interested. Add an optional
														message.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4">
													<div className="space-y-2">
														<Label>Message (Optional)</Label>
														<Textarea
															value={interestMessage}
															onChange={(e) => setInterestMessage(e.target.value)}
															placeholder="Introduce yourself, mention move-in date, ask questions..."
															rows={4}
														/>
													</div>
												</div>
												<DialogFooter>
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
							<CardTitle>Pricing Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Monthly Rent</span>
								<span className="font-medium">{formatCurrency(listing.rentPerMonth)}</span>
							</div>
							<Separator />
							<div className="flex justify-between">
								<span className="text-muted-foreground">Security Deposit</span>
								<span className="font-medium">{formatCurrency(listing.depositAmount)}</span>
							</div>
							<Separator />
							<div className="flex justify-between">
								<span className="text-muted-foreground">Total Move-in Cost</span>
								<span className="font-bold text-primary">
									{formatCurrency(listing.rentPerMonth + listing.depositAmount)}
								</span>
							</div>
							{/* total_capacity and current_occupants are snake_case */}
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Occupancy</span>
								<span>
									{listing.current_occupants}/{listing.total_capacity} occupied
								</span>
							</div>
							{/* bed_type is snake_case */}
							{listing.bed_type && (
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Bed Type</span>
									<span>{listing.bed_type.replace(/_/g, " ")}</span>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
