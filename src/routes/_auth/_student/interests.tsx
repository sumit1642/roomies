// src/routes/_auth/_student/interests.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, ExternalLink, X, Clock, CheckCircle, XCircle, Undo2, ChevronDown } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { toast } from "#/components/ui/sonner";
import { EmptyState } from "#/components/EmptyState";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { updateInterestStatus } from "#/lib/api/interests";
import { studentInterestsInfiniteQueryOptions } from "#/lib/queryOptions";
import { formatCurrency, formatDate } from "#/lib/format";
import { queryKeys } from "#/lib/queryKeys";
import type { InterestRequestWithListing, RequestStatus } from "#/types";

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
	const qc = useQueryClient();
	const [filter, setFilter] = useState<FilterStatus>("all");
	const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

	// ── Infinite query — replaces useEffect + useState array ──────────────────
	const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
		...studentInterestsInfiniteQueryOptions(filter === "all" ? undefined : filter),
	});

	const interests: InterestRequestWithListing[] = data?.pages.flatMap((p) => p.items) ?? [];

	// ── Withdraw mutation — optimistic update ──────────────────────────────────
	const withdrawMutation = useMutation({
		mutationFn: (interestId: string) => updateInterestStatus(interestId, "withdrawn"),
		onMutate: async () => {
			// Cancel in-flight refetches to avoid overwriting the optimistic update
			await qc.cancelQueries({ queryKey: queryKeys.interests() });
		},
		onSuccess: () => {
			// Invalidate so the cache reflects the new "withdrawn" status
			void qc.invalidateQueries({ queryKey: queryKeys.interests() });
			toast.success("Interest withdrawn");
		},
		onError: () => {
			toast.error("Failed to withdraw interest");
		},
		onSettled: () => {
			setConfirmWithdraw(null);
		},
	});

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
					{displayedInterests.length === 0 ?
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
										isWithdrawing={
											withdrawMutation.isPending &&
											withdrawMutation.variables === interest.interestRequestId
										}
									/>
								))}
							</div>
							{hasNextPage && (
								<div className="mt-6 flex justify-center">
									<Button
										variant="outline"
										onClick={() => void fetchNextPage()}
										disabled={isFetchingNextPage}
										className="gap-2">
										{isFetchingNextPage ?
											<Loader2 className="size-4 animate-spin" />
										:	<ChevronDown className="size-4" />}
										Load more
									</Button>
								</div>
							)}
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
				onConfirm={() => confirmWithdraw && withdrawMutation.mutate(confirmWithdraw)}
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
	const statusCfg = STATUS_CONFIG[interest.status];
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
