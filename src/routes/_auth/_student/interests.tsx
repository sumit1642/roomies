import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Heart, ExternalLink, X } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { toast } from "#/components/ui/sonner";
import { StatusBadge } from "#/components/StatusBadge";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { getMyInterests, updateInterestStatus } from "#/lib/api/interests";
import { formatCurrency } from "#/lib/format";
import type { InterestRequestWithListing, RequestStatus, Cursor } from "#/types";

export const Route = createFileRoute("/_auth/_student/interests")({
	component: InterestsPage,
	head: () => ({
		meta: [{ title: "My Interests - Roomies" }],
	}),
});

type FilterStatus = "all" | RequestStatus;

function InterestsPage() {
	const [interests, setInterests] = useState<InterestRequestWithListing[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
	const [filter, setFilter] = useState<FilterStatus>("all");
	const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
	const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

	const fetchInterests = async (status?: RequestStatus, cursor?: Cursor, append = false) => {
		try {
			const data = await getMyInterests(status, cursor);
			if (append) {
				setInterests((prev) => [...prev, ...data.items]);
			} else {
				setInterests(data.items);
			}
			setNextCursor(data.nextCursor);
		} catch {
			toast.error("Failed to load interests");
		}
	};

	useEffect(() => {
		setIsLoading(true);
		fetchInterests(filter === "all" ? undefined : filter).finally(() => setIsLoading(false));
	}, [filter]);

	const handleLoadMore = async (cursor: Cursor) => {
		setIsLoadingMore(true);
		await fetchInterests(filter === "all" ? undefined : filter, cursor, true);
		setIsLoadingMore(false);
	};

	const handleWithdraw = async (interestId: string) => {
		setWithdrawingId(interestId);
		try {
			await updateInterestStatus(interestId, "withdrawn");
			setInterests((prev) =>
				prev.map((i) => (i.interestRequestId === interestId ? { ...i, status: "withdrawn" } : i)),
			);
			toast.success("Interest withdrawn");
		} catch {
			toast.error("Failed to withdraw interest");
		} finally {
			setWithdrawingId(null);
			setConfirmWithdraw(null);
		}
	};

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">My Interests</h1>
				<p className="mt-2 text-muted-foreground">Track the interest requests you&apos;ve sent to listings</p>
			</div>

			<Tabs
				value={filter}
				onValueChange={(v) => setFilter(v as FilterStatus)}>
				<TabsList className="mb-6 flex flex-wrap h-auto">
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="pending">Pending</TabsTrigger>
					<TabsTrigger value="accepted">Accepted</TabsTrigger>
					<TabsTrigger value="declined">Declined</TabsTrigger>
					<TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
				</TabsList>

				<TabsContent
					value={filter}
					className="mt-0">
					{isLoading ?
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					: interests.length === 0 ?
						<EmptyState
							icon={Heart}
							title="No interests yet"
							description={
								filter === "all" ?
									"You haven't sent any interest requests yet"
								:	`No ${filter} interest requests`
							}
							action={filter === "all" ? { label: "Browse Listings", href: "/listings" } : undefined}
						/>
					:	<>
							<div className="space-y-4">
								{interests.map((interest) => (
									<InterestCard
										key={interest.interestRequestId}
										interest={interest}
										onWithdraw={() => setConfirmWithdraw(interest.interestRequestId)}
										isWithdrawing={withdrawingId === interest.interestRequestId}
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
				</TabsContent>
			</Tabs>

			<ConfirmDialog
				open={!!confirmWithdraw}
				onOpenChange={() => setConfirmWithdraw(null)}
				title="Withdraw Interest?"
				description="Are you sure you want to withdraw your interest? You won't be able to send interest to this listing again."
				confirmLabel="Withdraw"
				onConfirm={() => confirmWithdraw && handleWithdraw(confirmWithdraw)}
				variant="destructive"
			/>
		</div>
	);
}

function InterestCard({
	interest,
	onWithdraw,
	isWithdrawing,
}: {
	interest: InterestRequestWithListing;
	onWithdraw: () => void;
	isWithdrawing: boolean;
}) {
	const { listing } = interest;

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex-1 min-w-0">
						<div className="flex items-start gap-3">
							<div className="flex-1 min-w-0">
								<Link
									to="/listing/$id"
									params={{ id: listing.listingId }}
									className="font-semibold hover:underline line-clamp-1">
									{listing.title}
								</Link>
								<p className="text-sm text-muted-foreground">
									{listing.city} &bull; {formatCurrency(listing.rentPerMonth)}/month
								</p>
								{interest.message && (
									<p className="mt-2 text-sm text-muted-foreground line-clamp-2">
										&ldquo;{interest.message}&rdquo;
									</p>
								)}
								<p className="mt-2 text-xs text-muted-foreground">
									Sent on {new Date(interest.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<StatusBadge status={interest.status} />

						{interest.status === "pending" && (
							<Button
								variant="outline"
								size="sm"
								onClick={onWithdraw}
								disabled={isWithdrawing}>
								{isWithdrawing ?
									<Loader2 className="size-4 animate-spin" />
								:	<>
										<X className="size-4" />
										Withdraw
									</>
								}
							</Button>
						)}

						{interest.status === "accepted" && (
							<Button
								size="sm"
								asChild>
								<Link to="/connections">
									View Connection
									<ExternalLink className="size-4" />
								</Link>
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
