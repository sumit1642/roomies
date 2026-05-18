// src/routes/_auth/_admin/verification.tsx
// Admin: Paginated verification request queue with approve/reject actions.

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, ExternalLink, ClipboardCheck, ChevronDown } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Textarea } from "#/components/ui/textarea";
import { Label } from "#/components/ui/label";
import { Input } from "#/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { EmptyState } from "#/components/EmptyState";
import { toast } from "#/components/ui/sonner";
import { approveVerification, rejectVerification } from "#/lib/api/admin";
import { adminVerificationQueueInfiniteQueryOptions } from "#/lib/queryOptions";
import { queryKeys } from "#/lib/queryKeys";
import type { VerificationQueueItem } from "#/types";

export const Route = createFileRoute("/_auth/_admin/verification")({
	component: VerificationQueuePage,
	head: () => ({ meta: [{ title: "Verification Queue - Admin" }] }),
});

function VerificationQueuePage() {
	const qc = useQueryClient();
	const [approveTarget, setApproveTarget] = useState<VerificationQueueItem | null>(null);
	const [rejectTarget, setRejectTarget] = useState<VerificationQueueItem | null>(null);
	const [adminNotes, setAdminNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
		...adminVerificationQueueInfiniteQueryOptions(),
	});

	const items = data?.pages.flatMap((p) => p.items) ?? [];

	const approveMutation = useMutation({
		mutationFn: ({ requestId, notes }: { requestId: string; notes?: string }) =>
			approveVerification(requestId, notes),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: queryKeys.adminVerificationQueue() });
			toast.success("Verification approved successfully");
			setApproveTarget(null);
			setAdminNotes("");
		},
		onError: () => toast.error("Failed to approve verification"),
	});

	const rejectMutation = useMutation({
		mutationFn: ({ requestId, reason, notes }: { requestId: string; reason: string; notes?: string }) =>
			rejectVerification(requestId, reason, notes),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: queryKeys.adminVerificationQueue() });
			toast.success("Verification rejected");
			setRejectTarget(null);
			setRejectionReason("");
			setAdminNotes("");
		},
		onError: () => toast.error("Failed to reject verification"),
	});

	if (!items.length) {
		return (
			<EmptyState
				icon={ClipboardCheck}
				title="All clear!"
				description="No pending verification requests at the moment."
			/>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<VerificationCard
						key={item.request_id}
						item={item}
						onApprove={() => {
							setApproveTarget(item);
							setAdminNotes("");
						}}
						onReject={() => {
							setRejectTarget(item);
							setAdminNotes("");
							setRejectionReason("");
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

			{/* Approve Dialog */}
			<Dialog
				open={!!approveTarget}
				onOpenChange={(open) => !open && setApproveTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve Verification</DialogTitle>
						<DialogDescription>
							Approve <strong>{approveTarget?.business_name}</strong> submitted by{" "}
							{approveTarget?.owner_full_name}. This will mark their account as verified.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="approve-notes">Admin Notes (optional)</Label>
						<Textarea
							id="approve-notes"
							placeholder="Internal notes for this approval..."
							value={adminNotes}
							onChange={(e) => setAdminNotes(e.target.value)}
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setApproveTarget(null)}>
							Cancel
						</Button>
						<Button
							className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
							disabled={approveMutation.isPending}
							onClick={() =>
								approveTarget &&
								approveMutation.mutate({
									requestId: approveTarget.request_id,
									notes: adminNotes || undefined,
								})
							}>
							{approveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
							Approve
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog
				open={!!rejectTarget}
				onOpenChange={(open) => !open && setRejectTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Verification</DialogTitle>
						<DialogDescription>
							Reject <strong>{rejectTarget?.business_name}</strong>. Provide a reason so the owner knows
							what to fix.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="reject-reason">
								Rejection Reason <span className="text-destructive">*</span>
							</Label>
							<Input
								id="reject-reason"
								placeholder="e.g., Document unclear, wrong document type..."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="reject-notes">Admin Notes (optional)</Label>
							<Textarea
								id="reject-notes"
								placeholder="Internal notes..."
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRejectTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							className="gap-2"
							disabled={rejectMutation.isPending || !rejectionReason.trim()}
							onClick={() =>
								rejectTarget &&
								rejectMutation.mutate({
									requestId: rejectTarget.request_id,
									reason: rejectionReason,
									notes: adminNotes || undefined,
								})
							}>
							{rejectMutation.isPending && <Loader2 className="size-4 animate-spin" />}
							Reject
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function VerificationCard({
	item,
	onApprove,
	onReject,
}: {
	item: VerificationQueueItem;
	onApprove: () => void;
	onReject: () => void;
}) {
	const docLabel: Record<string, string> = {
		property_document: "Property Document",
		rental_agreement: "Rental Agreement",
		owner_id: "Owner ID",
		trade_license: "Trade License",
	};

	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<CardTitle className="text-base line-clamp-1">{item.business_name}</CardTitle>
						<CardDescription className="line-clamp-1">{item.owner_full_name}</CardDescription>
					</div>
					<Badge
						variant="warning"
						className="shrink-0 text-xs">
						Pending
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="flex-1 space-y-2 text-sm pb-3">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Email</span>
					<span className="font-medium truncate max-w-40">{item.email}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Document Type</span>
					<span className="font-medium">{docLabel[item.document_type] ?? item.document_type}</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-muted-foreground">Submitted</span>
					<span className="font-medium">{new Date(item.submitted_at).toLocaleDateString("en-IN")}</span>
				</div>
				<a
					href={item.document_url}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 text-primary hover:underline text-xs mt-1">
					<ExternalLink className="size-3.5" />
					View Document
				</a>
			</CardContent>

			<CardFooter className="gap-2 pt-0">
				<Button
					size="sm"
					variant="outline"
					className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
					onClick={onReject}>
					<XCircle className="size-3.5" />
					Reject
				</Button>
				<Button
					size="sm"
					className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
					onClick={onApprove}>
					<CheckCircle2 className="size-3.5" />
					Approve
				</Button>
			</CardFooter>
		</Card>
	);
}
