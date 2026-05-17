// src/routes/_auth/_admin/reports.tsx
// Admin: Paginated report queue with resolve actions.
//
// Design choices:
//  • Optimistic removal — resolved item disappears from the list immediately via
//    queryClient.setQueryData() on onMutate, rolled back on error (UX best-practice
//    for moderation queues: fast perceived response, no jarring re-renders).
//  • Inline resolve panel (Sheet-like card) rather than a modal, so the moderator
//    keeps the surrounding queue in view while deciding.
//  • Two resolutions:
//      resolved_kept    → content was fine, report dismissed
//      resolved_removed → rating hidden from public view
//  • Full rating context shown: scores, comment, reviewer → reviewee, reporter.

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";
import {
	Loader2,
	Flag,
	ChevronDown,
	CheckCircle2,
	EyeOff,
	AlertTriangle,
	MessageSquare,
	Star,
	User,
	X,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Textarea } from "#/components/ui/textarea";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { EmptyState } from "#/components/EmptyState";
import { UserAvatar } from "#/components/UserAvatar";
import { StarRating } from "#/components/StarRating";
import { toast } from "#/components/ui/sonner";
import { getReportQueue, resolveReport, type ReportResolution } from "#/lib/api/admin";
import { queryKeys } from "#/lib/queryKeys";
import type { AdminReportQueueItem, PaginatedResponse } from "#/types";

export const Route = createFileRoute("/_auth/_admin/reports")({
	component: ReportQueuePage,
	head: () => ({ meta: [{ title: "Report Queue - Admin" }] }),
});

// ── Reason labels ─────────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
	spam: "Spam",
	fake: "Fake / Fabricated",
	harassment: "Harassment",
	inappropriate: "Inappropriate Content",
	conflict_of_interest: "Conflict of Interest",
	other: "Other",
};

const REASON_COLOR: Record<string, string> = {
	harassment: "destructive",
	inappropriate: "destructive",
	fake: "warning",
	spam: "warning",
	conflict_of_interest: "secondary",
	other: "secondary",
} as Record<string, string>;

// ── Score row helper ──────────────────────────────────────────────────────────
function ScoreRow({ label, value }: { label: string; value: number | null }) {
	if (value === null) return null;
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-muted-foreground">{label}</span>
			<div className="flex items-center gap-1">
				<Star className="size-3 fill-amber-400 text-amber-400" />
				<span className="font-medium">{value}/5</span>
			</div>
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ReportQueuePage() {
	const qc = useQueryClient();
	const [resolveTarget, setResolveTarget] = useState<AdminReportQueueItem | null>(null);
	const [adminNotes, setAdminNotes] = useState("");

	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: queryKeys.adminReportQueue(),
		queryFn: ({ pageParam }) =>
			getReportQueue(pageParam as { cursorTime: string; cursorId: string } | undefined),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	const items = data?.pages.flatMap((p) => p.items) ?? [];

	// ── Resolve mutation with optimistic removal ───────────────────────────────
	const resolveMutation = useMutation({
		mutationFn: ({
			reportId,
			resolution,
			notes,
		}: {
			reportId: string;
			resolution: ReportResolution;
			notes?: string;
		}) => resolveReport(reportId, resolution, notes),

		// Optimistically remove the resolved item from the infinite list
		onMutate: async ({ reportId }) => {
			await qc.cancelQueries({ queryKey: queryKeys.adminReportQueue() });

			const previous = qc.getQueryData<InfiniteData<PaginatedResponse<AdminReportQueueItem>>>(
				queryKeys.adminReportQueue(),
			);

			qc.setQueryData<InfiniteData<PaginatedResponse<AdminReportQueueItem>>>(
				queryKeys.adminReportQueue(),
				(old) => {
					if (!old) return old;
					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							items: page.items.filter((item) => item.reportId !== reportId),
						})),
					};
				},
			);

			return { previous };
		},

		onError: (_err, _vars, context) => {
			// Rollback on error
			if (context?.previous) {
				qc.setQueryData(queryKeys.adminReportQueue(), context.previous);
			}
			toast.error("Failed to resolve report");
		},

		onSuccess: (_data, { resolution }) => {
			const msg =
				resolution === "resolved_removed"
					? "Rating hidden from public view"
					: "Report dismissed — rating kept visible";
			toast.success(msg);
			setResolveTarget(null);
			setAdminNotes("");
		},

		// Always reconcile with server after mutation
		onSettled: () => {
			void qc.invalidateQueries({ queryKey: queryKeys.adminReportQueue() });
		},
	});

	const handleResolve = (resolution: ReportResolution) => {
		if (!resolveTarget) return;
		resolveMutation.mutate({
			reportId: resolveTarget.reportId,
			resolution,
			notes: adminNotes || undefined,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!items.length) {
		return (
			<EmptyState
				icon={Flag}
				title="No open reports"
				description="The report queue is clear — all submitted reports have been resolved."
			/>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<ReportCard
						key={item.reportId}
						item={item}
						onResolve={() => {
							setResolveTarget(item);
							setAdminNotes("");
						}}
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

			{/* Resolve Dialog */}
			<Dialog
				open={!!resolveTarget}
				onOpenChange={(open) => !open && setResolveTarget(null)}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="size-4 text-amber-500" />
							Resolve Report
						</DialogTitle>
						<DialogDescription>
							Choose how to handle this report on{" "}
							<strong>{resolveTarget?.rating.reviewer.fullName}</strong>'s rating.
						</DialogDescription>
					</DialogHeader>

					{resolveTarget && (
						<div className="space-y-4">
							{/* Rating context */}
							<div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Rating Under Review
								</p>
								<div className="flex items-center gap-2">
									<UserAvatar
										name={resolveTarget.rating.reviewer.fullName}
										photoUrl={resolveTarget.rating.reviewer.profilePhotoUrl ?? undefined}
										size="sm"
									/>
									<div>
										<p className="text-sm font-medium">
											{resolveTarget.rating.reviewer.fullName}
										</p>
										<p className="text-xs text-muted-foreground">Reviewer</p>
									</div>
									<span className="text-muted-foreground mx-1">→</span>
									<UserAvatar
										name={resolveTarget.rating.reviewee.fullName}
										photoUrl={resolveTarget.rating.reviewee.profilePhotoUrl ?? undefined}
										size="sm"
									/>
									<div>
										<p className="text-sm font-medium">
											{resolveTarget.rating.reviewee.fullName}
										</p>
										<p className="text-xs text-muted-foreground">Reviewee</p>
									</div>
								</div>
								<StarRating rating={resolveTarget.rating.overallScore} size="sm" showValue />
								{resolveTarget.rating.comment && (
									<p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2 line-clamp-3">
										"{resolveTarget.rating.comment}"
									</p>
								)}
							</div>

							{/* Report context */}
							<div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1">
								<p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
									Report Details
								</p>
								<p className="text-sm">
									<span className="font-medium">Reason:</span>{" "}
									{REASON_LABELS[resolveTarget.reason] ?? resolveTarget.reason}
								</p>
								{resolveTarget.explanation && (
									<p className="text-sm text-muted-foreground">
										<span className="font-medium text-foreground">Note:</span>{" "}
										{resolveTarget.explanation}
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									Reported by{" "}
									<strong>{resolveTarget.reporter.fullName}</strong>
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="resolve-notes">Admin Notes (optional)</Label>
								<Textarea
									id="resolve-notes"
									placeholder="Internal notes about this decision..."
									value={adminNotes}
									onChange={(e) => setAdminNotes(e.target.value)}
									rows={2}
								/>
							</div>
						</div>
					)}

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => setResolveTarget(null)}
							className="sm:mr-auto">
							Cancel
						</Button>
						<Button
							variant="outline"
							className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
							disabled={resolveMutation.isPending}
							onClick={() => handleResolve("resolved_kept")}>
							{resolveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
							<CheckCircle2 className="size-4" />
							Dismiss — Keep Rating
						</Button>
						<Button
							variant="destructive"
							className="gap-2"
							disabled={resolveMutation.isPending}
							onClick={() => handleResolve("resolved_removed")}>
							{resolveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
							<EyeOff className="size-4" />
							Remove Rating
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({
	item,
	onResolve,
}: {
	item: AdminReportQueueItem;
	onResolve: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const badgeVariant = (REASON_COLOR[item.reason] ?? "secondary") as
		| "destructive"
		| "warning"
		| "secondary";

	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<CardTitle className="text-sm line-clamp-1 flex items-center gap-1.5">
							<Flag className="size-3.5 text-destructive shrink-0" />
							Report
						</CardTitle>
						<CardDescription className="text-xs mt-0.5">
							{new Date(item.submittedAt).toLocaleDateString("en-IN", {
								day: "numeric",
								month: "short",
								year: "numeric",
							})}
						</CardDescription>
					</div>
					<Badge variant={badgeVariant} className="shrink-0 text-xs">
						{REASON_LABELS[item.reason] ?? item.reason}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-3 text-sm pb-3">
				{/* Parties */}
				<div className="space-y-1.5">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Rating
					</p>
					<div className="flex items-center gap-2">
						<UserAvatar
							name={item.rating.reviewer.fullName}
							photoUrl={item.rating.reviewer.profilePhotoUrl ?? undefined}
							size="sm"
						/>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium truncate">{item.rating.reviewer.fullName}</p>
							<p className="text-xs text-muted-foreground">Reviewer</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<UserAvatar
							name={item.rating.reviewee.fullName}
							photoUrl={item.rating.reviewee.profilePhotoUrl ?? undefined}
							size="sm"
						/>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium truncate">{item.rating.reviewee.fullName}</p>
							<p className="text-xs text-muted-foreground">Reviewee</p>
						</div>
					</div>
				</div>

				<Separator />

				{/* Overall score */}
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-xs">Overall Score</span>
					<StarRating rating={item.rating.overallScore} size="sm" showValue />
				</div>

				{/* Comment preview */}
				{item.rating.comment && (
					<div className="flex items-start gap-1.5 text-xs text-muted-foreground">
						<MessageSquare className="size-3.5 shrink-0 mt-0.5" />
						<p className="line-clamp-2 italic">"{item.rating.comment}"</p>
					</div>
				)}

				{/* Expandable detail scores */}
				{expanded && (
					<div className="space-y-1.5 bg-muted/30 rounded-lg p-2.5">
						<ScoreRow label="Cleanliness" value={item.rating.cleanlinessScore} />
						<ScoreRow label="Communication" value={item.rating.communicationScore} />
						<ScoreRow label="Reliability" value={item.rating.reliabilityScore} />
						<ScoreRow label="Value" value={item.rating.valueScore} />
					</div>
				)}

				{/* Reporter */}
				<Separator />
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<User className="size-3.5 shrink-0" />
					<span>
						Reported by <strong className="text-foreground">{item.reporter.fullName}</strong>
					</span>
				</div>

				{item.explanation && (
					<p className="text-xs text-muted-foreground border-l-2 border-amber-400/60 pl-2 line-clamp-2">
						"{item.explanation}"
					</p>
				)}
			</CardContent>

			<CardFooter className="pt-0 gap-2 flex-col">
				<Button
					variant="ghost"
					size="sm"
					className="w-full text-xs text-muted-foreground h-7"
					onClick={() => setExpanded((p) => !p)}>
					{expanded ?
						<><X className="size-3 mr-1" /> Hide scores</>
					:	<><ChevronDown className="size-3 mr-1" /> Show all scores</>}
				</Button>
				<Button
					size="sm"
					className="w-full gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
					onClick={onResolve}>
					<Flag className="size-3.5" />
					Review & Resolve
				</Button>
			</CardFooter>
		</Card>
	);
}
