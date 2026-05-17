// src/routes/_auth/_student/roommates.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Loader2,
	UserSearch,
	User,
	GraduationCap,
	ShieldOff,
	ToggleLeft,
	ToggleRight,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { toast } from "#/components/ui/sonner";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { StarRating } from "#/components/StarRating";
import { UserAvatar } from "#/components/UserAvatar";
import { updateRoommateProfile, blockUser, unblockUser } from "#/lib/api/roommates";
import { roommateFeedInfiniteQueryOptions } from "#/lib/queryOptions";
import { useAuth } from "#/context/AuthContext";
import type { RoommateProfile, Cursor } from "#/types";

export const Route = createFileRoute("/_auth/_student/roommates")({
	component: RoommatesPage,
	head: () => ({
		meta: [{ title: "Find Roommates - Roomies" }],
	}),
});

const GENDER_LABELS: Record<string, string> = {
	male: "Male",
	female: "Female",
	other: "Other",
	prefer_not_to_say: "Any",
};

function RoommatesPage() {
	const { user } = useAuth();
	const qc = useQueryClient();
	const [isOptedIn, setIsOptedIn] = useState(false);
	const [blockTarget, setBlockTarget] = useState<string | null>(null);
	const [blockingId, setBlockingId] = useState<string | null>(null);

	const roommateFeedKey = ["roommates", "feed"] as const;

	const {
		data,
		isFetchingNextPage: isLoadingMore,
		fetchNextPage,
	} = useInfiniteQuery({
		...roommateFeedInfiniteQueryOptions(),
	});

	const profiles = data?.pages.flatMap((page) => page.items) ?? [];
	const lastPage = data?.pages[data.pages.length - 1];
	const nextCursor = lastPage ? lastPage.nextCursor : null;

	const handleLoadMore = async (_cursor: Cursor) => {
		try {
			await fetchNextPage();
		} catch {
			toast.error("Failed to load more profiles");
		}
	};

	const toggleOptInMutation = useMutation({
		mutationFn: (newValue: boolean) => {
			if (!user?.userId) throw new Error("User not found");
			return updateRoommateProfile(user.userId, { lookingForRoommate: newValue });
		},
		onSuccess: async (updatedProfile) => {
			setIsOptedIn(updatedProfile.lookingForRoommate ?? false);
			await qc.invalidateQueries({ queryKey: roommateFeedKey });
			toast.success(
				updatedProfile.lookingForRoommate ?
					"You're now visible in the roommate feed!"
				:	"You've opted out of roommate matching.",
			);
		},
		onError: () => {
			toast.error("Failed to update roommate preference.");
		},
	});

	const blockMutation = useMutation({
		mutationFn: async (targetUserId: string) => {
			if (!user?.userId) throw new Error("User not found");
			await blockUser(user.userId, targetUserId);
			return targetUserId;
		},
		onSuccess: async (targetUserId) => {
			setBlockingId(null);
			setBlockTarget(null);
			qc.setQueryData(
				roommateFeedKey,
				(old: { pages: Array<{ items: RoommateProfile[] }>; pageParams: unknown[] } | undefined) =>
					old ?
						{
							...old,
							pages: old.pages.map((page) => ({
								...page,
								items: page.items.filter((p) => p.userId !== targetUserId),
							})),
						}
					:	old,
			);
			toast.success("User blocked and removed from your feed.", {
				action: {
					label: "Undo",
					onClick: async () => {
						if (!user?.userId) return;
						await unblockUser(user.userId, targetUserId);
						await qc.invalidateQueries({ queryKey: roommateFeedKey });
					},
				},
			});
		},
		onError: () => {
			setBlockingId(null);
			setBlockTarget(null);
			toast.error("Failed to block user.");
		},
	});

	const handleToggleOptIn = async () => {
		if (!user?.userId) return;
		const newValue = !isOptedIn;
		await toggleOptInMutation.mutateAsync(newValue);
	};

	const handleBlock = async (targetUserId: string) => {
		if (!user?.userId) return;
		setBlockingId(targetUserId);
		await blockMutation.mutateAsync(targetUserId);
	};

	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-start justify-between flex-wrap gap-4">
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-2">
							<UserSearch className="size-8 text-primary" />
							Find Roommates
						</h1>
						<p className="mt-2 text-muted-foreground">
							Connect with students who have opted in to roommate matching
						</p>
					</div>
					<div className="flex items-center gap-3 flex-wrap">
						{/* Opt-In Toggle Button */}
						<Button
							variant={isOptedIn ? "default" : "outline"}
							size="sm"
							onClick={handleToggleOptIn}
							disabled={toggleOptInMutation.isPending}
							className="gap-2">
							{toggleOptInMutation.isPending ?
								<Loader2 className="size-4 animate-spin" />
							: isOptedIn ?
								<ToggleRight className="size-4" />
							:	<ToggleLeft className="size-4" />}
							{isOptedIn ? "Visible in Feed" : "Hidden from Feed"}
						</Button>
					</div>
				</div>
			</div>

			{/* Opt-in nudge banner */}
			{!isOptedIn && (
				<Card className="mb-6 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
					<CardContent className="flex items-center justify-between p-4 gap-4 flex-wrap">
						<div>
							<p className="font-semibold">Want others to find you?</p>
							<p className="text-sm text-muted-foreground">
								Toggle &quot;Hidden from Feed&quot; above to appear in the roommate finder for
								compatible students.
							</p>
						</div>
						<Button
							onClick={handleToggleOptIn}
							disabled={toggleOptInMutation.isPending}
							size="sm">
							{toggleOptInMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
							Join Matching
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Feed */}
			{profiles.length === 0 ?
				<EmptyState
					icon={UserSearch}
					title="No roommates found"
					description="No other students have opted into roommate matching yet, or no one matches your current filters."
				/>
			:	<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{profiles.map((profile) => (
							<RoommateCard
								key={profile.userId}
								profile={profile}
								onBlock={() => setBlockTarget(profile.userId)}
								isBlocking={blockingId === profile.userId}
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

			{/* Block Confirm Dialog */}
			<ConfirmDialog
				open={!!blockTarget}
				onOpenChange={() => setBlockTarget(null)}
				title="Block this user?"
				description="They won't appear in your roommate feed anymore. You can unblock them later."
				confirmLabel="Block"
				onConfirm={() => blockTarget && handleBlock(blockTarget)}
				variant="destructive"
			/>
		</div>
	);
}

function RoommateCard({
	profile,
	onBlock,
	isBlocking,
}: {
	profile: RoommateProfile;
	onBlock: () => void;
	isBlocking: boolean;
}) {
	const hasScore = profile.compatibilityScore !== null;

	return (
		<Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
			<CardHeader className="pb-3 pt-4 px-4">
				<div className="flex items-start gap-3">
					<UserAvatar
						name={profile.fullName}
						photoUrl={profile.profilePhotoUrl ?? undefined}
						size="md"
					/>
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<p className="font-semibold text-sm line-clamp-1">{profile.fullName}</p>
							{hasScore && (
								<Badge
									variant={
										profile.compatibilityScore! >= 70 ? "success"
										: profile.compatibilityScore! >= 40 ?
											"warning"
										:	"secondary"
									}
									className="text-xs shrink-0">
									{profile.compatibilityScore}% match
								</Badge>
							)}
						</div>
						{profile.gender && (
							<p className="text-xs text-muted-foreground mt-0.5">
								{GENDER_LABELS[profile.gender] ?? profile.gender}
							</p>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-4 pb-4 space-y-3">
				{/* Bio + Roommate Bio */}
				{profile.bio && (
					<p className="text-sm text-muted-foreground line-clamp-2 italic">&ldquo;{profile.bio}&rdquo;</p>
				)}
				{profile.roommateBio && (
					<p className="text-xs text-muted-foreground line-clamp-2 border-l-2 border-primary/30 pl-2">
						<span className="font-medium text-foreground/70">Looking for: </span>
						{profile.roommateBio}
					</p>
				)}

				{/* Education */}
				{(profile.course || profile.yearOfStudy) && (
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<GraduationCap className="size-3.5 shrink-0" />
						<span className="line-clamp-1">
							{[profile.course, profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : null]
								.filter(Boolean)
								.join(" · ")}
						</span>
					</div>
				)}

				{/* Rating */}
				{profile.averageRating > 0 && (
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<StarRating
							rating={profile.averageRating}
							size="sm"
						/>
						<span>
							{profile.averageRating.toFixed(1)} ({profile.ratingCount})
						</span>
					</div>
				)}

				{/* Preferences */}
				{profile.preferences.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{profile.preferences.slice(0, 3).map((pref) => (
							<Badge
								key={pref.preferenceKey}
								variant="outline"
								className="text-xs capitalize">
								{pref.preferenceValue.replace(/_/g, " ")}
							</Badge>
						))}
						{profile.preferences.length > 3 && (
							<Badge
								variant="outline"
								className="text-xs">
								+{profile.preferences.length - 3}
							</Badge>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center gap-2 pt-1">
					<Button
						size="sm"
						variant="outline"
						className="flex-1 text-xs"
						asChild>
						<Link
							to="/browse"
							search={{}}
							className="flex items-center gap-1">
							<User className="size-3.5 mr-1" />
							Browse Their City
						</Link>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
						onClick={onBlock}
						disabled={isBlocking}
						title="Block this user">
						{isBlocking ?
							<Loader2 className="size-3.5 animate-spin" />
						:	<ShieldOff className="size-3.5" />}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
