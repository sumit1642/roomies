// src/routes/_auth/_student/interests.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Heart, ExternalLink, X, Clock, CheckCircle, XCircle, Undo2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { toast } from "#/components/ui/sonner";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { StarRating } from "#/components/StarRating";
import { getMyInterests, updateInterestStatus } from "#/lib/api/interests";
import { formatCurrency, formatDate } from "#/lib/format";
import type { InterestRequestWithListing, RequestStatus, Cursor } from "#/types";

export const Route = createFileRoute("/_auth/_student/interests")({
	component: InterestsPage,
	head: () => ({
		meta: [{ title: "My Interests - Roomies" }],
	}),
});

type FilterStatus = "all" | RequestStatus;

const STATUS_CONFIG: Record<
	RequestStatus,
	{
		label: string;
		icon: typeof Clock;
		color: string;
		badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
	}
> = {
	pending: { label: "Pending", icon: Clock, color: "text-amber-600", badgeVariant: "warning" },
	accepted: { label: "Accepted", icon: CheckCircle, color: "text-emerald-600", badgeVariant: "success" },
	declined: { label: "Declined", icon: XCircle, color: "text-red-600", badgeVariant: "destructive" },
	withdrawn: { label: "Withdrawn", icon: Undo2, color: "text-slate-500", badgeVariant: "secondary" },
	expired: { label: "Expired", icon: Clock, color: "text-slate-400", badgeVariant: "secondary" },
};

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
				prev.map((i) =>
					i.interestRequestId === interestId ? { ...i, status: "withdrawn" as RequestStatus } : i,
				),
			);
			toast.success("Interest withdrawn");
		} catch {
			toast.error("Failed to withdraw interest");
		} finally {
			setWithdrawingId(null);
			setConfirmWithdraw(null);
		}
	};

	const counts: Record<string, number> = { all: interests.length };
	for (const key of Object.keys(STATUS_CONFIG)) {
		counts[key] = interests.filter((i) => i.status === key).length;
	}

	const displayedInterests = filter === "all" ? interests : interests.filter((i) => i.status === filter);

	return (
		<div className="mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">My Interests</h1>
				<p className="mt-2 text-muted-foreground">Track the interest requests you've sent to listings</p>
			</div>

			<Tabs
				value={filter}
				onValueChange={(v) => setFilter(v as FilterStatus)}>
				<TabsList className="mb-6 flex flex-wrap h-auto gap-1">
					<TabsTrigger value="all">All ({interests.length})</TabsTrigger>
					<TabsTrigger value="pending">Pending</TabsTrigger>
					<TabsTrigger value="accepted">Accepted</TabsTrigger>
					<TabsTrigger value="declined">Declined</TabsTrigger>
					<TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
					<TabsTrigger value="expired">Expired</TabsTrigger>
				</TabsList>

				<TabsContent
					value={filter}
					className="mt-0">
					{isLoading ?
						<div className="flex items-center justify-center py-16">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					: displayedInterests.length === 0 ?
						<EmptyState
							icon={Heart}
							title={filter === "all" ? "No interests yet" : `No ${filter} interest requests`}
							description={
								filter === "all" ?
									"Browse listings and express interest to see them here."
								:	`You don't have any ${filter} interest requests.`
							}
							action={filter === "all" ? { label: "Browse Listings", href: "/browse" } : undefined}
						/>
					:	<>
							<div className="space-y-4">
								{displayedInterests.map((interest) => (
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
				description="This will withdraw your interest request. You won't be able to send interest to this listing again unless the owner removes your restriction."
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
	const statusCfg = STATUS_CONFIG[interest.status] || STATUS_CONFIG.pending;
	const StatusIcon = statusCfg.icon;

	return (
		<Card className="overflow-hidden transition-shadow hover:shadow-md">
			<CardHeader className="pb-0 pt-4 px-4">
				<div className="flex items-start gap-3">
					<div className={`mt-0.5 ${statusCfg.color}`}>
						<StatusIcon className="size-5" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2 flex-wrap">
							<Link
								to="/listing/$id"
								params={{ id: listing.listingId }}
								className="font-semibold hover:underline text-base line-clamp-1 flex-1">
								{listing.title}
							</Link>
							<Badge variant={statusCfg.badgeVariant}>{statusCfg.label}</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-0.5">
							{listing.city} &bull;{" "}
							<span className="font-medium text-foreground">
								{formatCurrency(listing.rentPerMonth)}/mo
							</span>
						</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-3 px-4 pb-4">
				{interest.message && (
					<div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border/50">
						<p className="text-sm text-muted-foreground italic line-clamp-2">"{interest.message}"</p>
					</div>
				)}

				<div className="flex items-center justify-between flex-wrap gap-3">
					<p className="text-xs text-muted-foreground">
						Sent {formatDate(interest.createdAt)}
						{interest.updatedAt !== interest.createdAt && (
							<> &bull; Updated {formatDate(interest.updatedAt)}</>
						)}
					</p>

					<div className="flex items-center gap-2">
						{interest.status === "accepted" && (
							<Button
								size="sm"
								asChild>
								<Link to="/connections">
									View Connection
									<ExternalLink className="size-3.5 ml-1" />
								</Link>
							</Button>
						)}
						{interest.status === "pending" && (
							<Button
								variant="outline"
								size="sm"
								onClick={onWithdraw}
								disabled={isWithdrawing}
								className="text-destructive border-destructive/30 hover:bg-destructive/10">
								{isWithdrawing ?
									<Loader2 className="size-4 animate-spin" />
								:	<>
										<X className="size-4 mr-1" />
										Withdraw
									</>
								}
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
