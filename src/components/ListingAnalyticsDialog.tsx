// src/components/ListingAnalyticsDialog.tsx
// Shows views, interest breakdown, and conversion rate for a single listing.
// Fetched on demand when the dialog opens — no background polling needed.

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "#/components/ui/dialog";
import { Loader2, Eye, Heart, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { getListingAnalytics } from "#/lib/api/listings";
import { formatDate } from "#/lib/format";

interface Props {
	listingId: string;
	listingTitle: string;
	open: boolean;
	onClose: () => void;
}

function StatRow({
	label,
	value,
	icon: Icon,
	accent,
}: {
	label: string;
	value: number | string;
	icon: typeof Eye;
	accent?: string;
}) {
	return (
		<div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
				{label}
			</div>
			<span className="text-sm font-semibold">{value}</span>
		</div>
	);
}

export function ListingAnalyticsDialog({ listingId, listingTitle, open, onClose }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ["listing-analytics", listingId],
		queryFn: () => getListingAnalytics(listingId),
		enabled: open,
		staleTime: 2 * 60 * 1000,
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<TrendingUp className="size-4 text-primary" />
						Analytics
					</DialogTitle>
					<DialogDescription className="line-clamp-1">{listingTitle}</DialogDescription>
				</DialogHeader>

				{isLoading ?
					<div className="flex items-center justify-center py-10">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				: data ?
					<div className="space-y-1">
						<div className="text-xs text-muted-foreground mb-3">
							Created {formatDate(data.createdAt)}
							{data.expiresAt && <> · Expires {formatDate(data.expiresAt)}</>}
						</div>

						<StatRow
							label="Total Views"
							value={data.views}
							icon={Eye}
						/>
						<StatRow
							label="Total Interests"
							value={data.interests.total}
							icon={Heart}
							accent="text-rose-500"
						/>
						<StatRow
							label="Pending"
							value={data.interests.pending}
							icon={Clock}
							accent="text-amber-500"
						/>
						<StatRow
							label="Accepted"
							value={data.interests.accepted}
							icon={CheckCircle}
							accent="text-emerald-500"
						/>
						<StatRow
							label="Declined"
							value={data.interests.declined}
							icon={XCircle}
							accent="text-red-500"
						/>
						<StatRow
							label="Withdrawn / Expired"
							value={data.interests.withdrawn + data.interests.expired}
							icon={Clock}
						/>

						{data.conversionRate !== null && (
							<div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
								<p className="text-xs text-muted-foreground">Conversion Rate</p>
								<p className="text-2xl font-bold text-primary">{data.conversionRate}%</p>
								<p className="text-xs text-muted-foreground">of views led to an interest request</p>
							</div>
						)}
					</div>
				:	<p className="text-sm text-muted-foreground text-center py-8">No analytics data available.</p>}
			</DialogContent>
		</Dialog>
	);
}
