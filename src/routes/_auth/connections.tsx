// src/routes/_auth/connections.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { UserAvatar } from "#/components/UserAvatar";
import { EmptyState } from "#/components/EmptyState";
import { StarRating } from "#/components/StarRating";
import { getMyConnections, confirmConnection, getConnection } from "#/lib/api/connections";
import { getListingInterests, updateInterestStatus } from "#/lib/api/interests";
import { useAuth } from "#/context/AuthContext";
import type { ConnectionListItem, ConnectionDetail, InterestRequestWithStudent } from "#/types";
import { toast } from "#/components/ui/sonner";
import {
	Users,
	Check,
	Clock,
	Loader2,
	Phone,
	Mail,
	GraduationCap,
	Star,
	MessageSquare,
	ChevronRight,
	CheckCheck,
	Home,
	Heart,
	AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, formatDate as formatDateFn } from "date-fns";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/connections")({
	component: ConnectionsPage,
});

type TabFilter = "all" | "pending" | "confirmed";

function ConnectionsPage() {
	const { user, role } = useAuth();
	const [connections, setConnections] = useState<ConnectionListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabFilter>("all");
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
	const [connectionDetail, setConnectionDetail] = useState<ConnectionDetail | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	// Owner-specific: pending interest requests to manage
	const [pendingInterests, setPendingInterests] = useState<InterestRequestWithStudent[]>([]);
	const [isLoadingInterests, setIsLoadingInterests] = useState(false);

	const isOwner = role === "pg_owner";
	const isStudent = role === "student";

	useEffect(() => {
		fetchConnections();
	}, []);

	const fetchConnections = async () => {
		try {
			setIsLoading(true);
			const response = await getMyConnections();
			setConnections(response.items);
		} catch {
			toast.error("Failed to load connections");
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmConnection = async (connectionId: string) => {
		setProcessingId(connectionId);
		try {
			await confirmConnection(connectionId);
			toast.success("Connection confirmed from your side!");
			fetchConnections();
		} catch {
			toast.error("Failed to confirm connection");
		} finally {
			setProcessingId(null);
		}
	};

	const handleOpenDetail = async (connectionId: string) => {
		setSelectedConnectionId(connectionId);
		setIsLoadingDetail(true);
		setConnectionDetail(null);
		try {
			const detail = await getConnection(connectionId);
			setConnectionDetail(detail);
		} catch {
			toast.error("Failed to load connection details");
		} finally {
			setIsLoadingDetail(false);
		}
	};

	const filteredConnections = connections.filter((conn) => {
		if (activeTab === "pending") return conn.confirmationStatus !== "confirmed";
		if (activeTab === "confirmed") return conn.confirmationStatus === "confirmed";
		return true;
	});

	const pendingCount = connections.filter((c) => c.confirmationStatus !== "confirmed").length;
	const confirmedCount = connections.filter((c) => c.confirmationStatus === "confirmed").length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Connections</h1>
				<p className="text-muted-foreground mt-1">
					{isOwner ? "Students who matched with your listings" : "Your connections with PG owners"}
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as TabFilter)}>
				<TabsList>
					<TabsTrigger value="all">All ({connections.length})</TabsTrigger>
					<TabsTrigger value="pending">
						Pending ({pendingCount})
						{pendingCount > 0 && <span className="ml-1.5 size-2 rounded-full bg-amber-500 inline-block" />}
					</TabsTrigger>
					<TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
				</TabsList>

				<TabsContent
					value={activeTab}
					className="mt-6">
					{filteredConnections.length === 0 ?
						<EmptyState
							icon={Users}
							title={
								activeTab === "pending" ? "No pending connections"
								: activeTab === "confirmed" ?
									"No confirmed connections yet"
								:	"No connections yet"
							}
							description={
								isStudent ?
									"Express interest in listings to connect with PG owners."
								:	"When students express interest in your listings, connections will appear here."
							}
						/>
					:	<div className="grid gap-4 md:grid-cols-2">
							{filteredConnections.map((connection) => (
								<ConnectionCard
									key={connection.connectionId}
									connection={connection}
									isOwner={isOwner}
									isProcessing={processingId === connection.connectionId}
									onConfirm={() => handleConfirmConnection(connection.connectionId)}
									onViewDetail={() => handleOpenDetail(connection.connectionId)}
								/>
							))}
						</div>
					}
				</TabsContent>
			</Tabs>

			{/* Connection Detail Dialog */}
			<Dialog
				open={!!selectedConnectionId}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedConnectionId(null);
						setConnectionDetail(null);
					}
				}}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Connection Details</DialogTitle>
						<DialogDescription>Full details about this connection</DialogDescription>
					</DialogHeader>

					{isLoadingDetail ?
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					: connectionDetail ?
						<ConnectionDetailView
							detail={connectionDetail}
							isOwner={isOwner}
							onConfirm={() => {
								handleConfirmConnection(connectionDetail.connectionId);
								setSelectedConnectionId(null);
							}}
						/>
					:	null}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ConnectionCard({
	connection,
	isOwner,
	isProcessing,
	onConfirm,
	onViewDetail,
}: {
	connection: ConnectionListItem;
	isOwner: boolean;
	isProcessing: boolean;
	onConfirm: () => void;
	onViewDetail: () => void;
}) {
	const isConfirmed = connection.confirmationStatus === "confirmed";
	const name = connection.otherParty.fullName || (isOwner ? "Student" : "PG Owner");

	return (
		<Card
			className={cn(
				"overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
				!isConfirmed && "border-amber-200/60 dark:border-amber-900/60",
			)}
			onClick={onViewDetail}>
			<CardHeader className="pb-3 pt-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<UserAvatar
							name={name}
							photoUrl={connection.otherParty.profilePhotoUrl}
							size="md"
						/>
						<div>
							<CardTitle className="text-base">{name}</CardTitle>
							<CardDescription className="text-xs mt-0.5">
								{isOwner ? "Student" : "PG Owner"}
							</CardDescription>
						</div>
					</div>
					<div className="flex flex-col items-end gap-1">
						{isConfirmed ?
							<Badge
								variant="success"
								className="text-xs">
								<CheckCheck className="size-3 mr-1" />
								Confirmed
							</Badge>
						:	<Badge
								variant="warning"
								className="text-xs">
								<Clock className="size-3 mr-1" />
								Pending
							</Badge>
						}
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-4">
				{connection.listing && (
					<div className="mb-3 p-2.5 bg-muted/50 rounded-lg text-sm">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Home className="size-3.5 shrink-0" />
							<span className="truncate font-medium text-foreground">{connection.listing.title}</span>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5 ml-5">{connection.listing.city}</p>
					</div>
				)}

				{connection.otherParty.averageRating > 0 && (
					<div className="mb-3 flex items-center gap-1.5">
						<StarRating
							rating={connection.otherParty.averageRating}
							size="sm"
						/>
						<span className="text-xs text-muted-foreground">
							{connection.otherParty.averageRating.toFixed(1)}
						</span>
					</div>
				)}

				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						{formatDistanceToNow(new Date(connection.createdAt), { addSuffix: true })}
					</p>
					<div className="flex items-center gap-2">
						{!isConfirmed && (
							<Button
								size="sm"
								variant="outline"
								onClick={(e) => {
									e.stopPropagation();
									onConfirm();
								}}
								disabled={isProcessing}
								className="text-xs h-7">
								{isProcessing ?
									<Loader2 className="size-3.5 animate-spin" />
								:	<>
										<Check className="size-3.5 mr-1" />
										Confirm My Side
									</>
								}
							</Button>
						)}
						<Button
							size="sm"
							variant="ghost"
							className="text-xs h-7"
							onClick={(e) => {
								e.stopPropagation();
								onViewDetail();
							}}>
							Details
							<ChevronRight className="size-3.5 ml-0.5" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ConnectionDetailView({
	detail,
	isOwner,
	onConfirm,
}: {
	detail: ConnectionDetail;
	isOwner: boolean;
	onConfirm: () => void;
}) {
	const name = detail.otherParty.fullName || (isOwner ? "Student" : "PG Owner");
	const isConfirmed = detail.confirmationStatus === "confirmed";

	return (
		<div className="space-y-6">
			{/* Person Header */}
			<div className="flex items-start gap-4">
				<UserAvatar
					name={name}
					photoUrl={detail.otherParty.profilePhotoUrl}
					size="xl"
				/>
				<div className="flex-1">
					<h3 className="text-xl font-bold">{name}</h3>
					<p className="text-sm text-muted-foreground">{isOwner ? "Student" : "PG Owner"}</p>
					{detail.otherParty.averageRating > 0 && (
						<div className="flex items-center gap-2 mt-1.5">
							<StarRating
								rating={detail.otherParty.averageRating}
								size="sm"
								showValue
							/>
							<span className="text-xs text-muted-foreground">
								({detail.otherParty.ratingCount ?? 0} reviews)
							</span>
						</div>
					)}
				</div>
				{isConfirmed ?
					<Badge variant="success">
						<CheckCheck className="size-3.5 mr-1" />
						Confirmed
					</Badge>
				:	<Badge variant="warning">
						<Clock className="size-3.5 mr-1" />
						Pending
					</Badge>
				}
			</div>

			<Separator />

			{/* Status Info */}
			<div className="space-y-3">
				<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Confirmation Status
				</h4>
				<div className="grid grid-cols-2 gap-3">
					<div
						className={cn(
							"p-3 rounded-lg border text-sm text-center",
							detail.initiatorConfirmed ?
								"bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
							:	"bg-muted border-border",
						)}>
						<Check
							className={cn(
								"size-4 mx-auto mb-1",
								detail.initiatorConfirmed ? "text-emerald-600" : "text-muted-foreground",
							)}
						/>
						<p className="font-medium text-xs">Student</p>
						<p className="text-xs text-muted-foreground">
							{detail.initiatorConfirmed ? "Confirmed" : "Pending"}
						</p>
					</div>
					<div
						className={cn(
							"p-3 rounded-lg border text-sm text-center",
							detail.counterpartConfirmed ?
								"bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
							:	"bg-muted border-border",
						)}>
						<Check
							className={cn(
								"size-4 mx-auto mb-1",
								detail.counterpartConfirmed ? "text-emerald-600" : "text-muted-foreground",
							)}
						/>
						<p className="font-medium text-xs">PG Owner</p>
						<p className="text-xs text-muted-foreground">
							{detail.counterpartConfirmed ? "Confirmed" : "Pending"}
						</p>
					</div>
				</div>

				{!isConfirmed && (
					<Button
						onClick={onConfirm}
						className="w-full"
						size="sm">
						<Check className="size-4 mr-2" />
						Confirm My Side (met in person)
					</Button>
				)}
			</div>

			{/* Listing Info */}
			{detail.listing && (
				<>
					<Separator />
					<div className="space-y-2">
						<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Listing</h4>
						<div className="p-3 bg-muted/50 rounded-lg">
							<p className="font-semibold">{detail.listing.title}</p>
							<p className="text-sm text-muted-foreground">{detail.listing.city}</p>
							{detail.listing.rentPerMonth && (
								<p className="text-sm font-medium mt-1">
									₹{detail.listing.rentPerMonth.toLocaleString("en-IN")}/month
								</p>
							)}
						</div>
					</div>
				</>
			)}

			{/* Timeline */}
			<Separator />
			<div className="space-y-2">
				<h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h4>
				<div className="space-y-1 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Connected</span>
						<span>{formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })}</span>
					</div>
					{detail.startDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Start Date</span>
							<span>{detail.startDate}</span>
						</div>
					)}
					{detail.endDate && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">End Date</span>
							<span>{detail.endDate}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
