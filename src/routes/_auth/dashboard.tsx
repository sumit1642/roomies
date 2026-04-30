// src/routes/_auth/dashboard.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
	Heart,
	Users,
	Bookmark,
	Search,
	Building2,
	Plus,
	AlertCircle,
	CheckCircle,
	Clock,
	ArrowRight,
	Star,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { useAuth } from "#/context/AuthContext";
import { getNotifications } from "#/lib/api/notifications";
import { getMyInterests } from "#/lib/api/interests";
import { getMyConnections } from "#/lib/api/connections";
import { getSavedListings } from "#/lib/api/listings";
import { getMyProperties } from "#/lib/api/properties";
import { getStudentProfile, getPgOwnerProfile } from "#/lib/api/profiles";
import { queryKeys } from "#/lib/queryKeys";
import { STALE } from "#/lib/queryClient";
import type { Notification, StudentProfile, PgOwnerProfile } from "#/types";
import { formatDistanceToNow } from "date-fns";
import { StarRating } from "#/components/StarRating";

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage,
	head: () => ({
		meta: [{ title: "Dashboard - Roomies" }],
	}),
});

function DashboardPage() {
	const { user, role, isEmailVerified } = useAuth();

	if (!user?.userId) return null;

	if (role === "pg_owner") {
		return <PgOwnerDashboard userId={user.userId} />;
	}

	return (
		<StudentDashboard
			userId={user.userId}
			isEmailVerified={isEmailVerified}
		/>
	);
}

function StudentDashboard({ userId, isEmailVerified }: { userId: string; isEmailVerified: boolean }) {
	const { data: profile } = useQuery({
		queryKey: queryKeys.studentProfile(userId),
		queryFn: () => getStudentProfile(userId),
		staleTime: STALE.PROFILE,
	});

	const { data: pendingInterestsData, isLoading: loadingPending } = useQuery({
		queryKey: queryKeys.interests("pending"),
		queryFn: () => getMyInterests("pending"),
		staleTime: STALE.TRANSACTIONAL,
	});

	const { data: acceptedInterestsData, isLoading: loadingAccepted } = useQuery({
		queryKey: queryKeys.interests("accepted"),
		queryFn: () => getMyInterests("accepted"),
		staleTime: STALE.TRANSACTIONAL,
	});

	const { data: connectionsData, isLoading: loadingConnections } = useQuery({
		queryKey: queryKeys.connections("confirmed"),
		queryFn: () => getMyConnections("confirmed"),
		staleTime: STALE.TRANSACTIONAL,
	});

	const { data: savedData, isLoading: loadingSaved } = useQuery({
		queryKey: queryKeys.savedListings(),
		queryFn: () => getSavedListings(),
		staleTime: STALE.FEED,
	});

	const { data: notificationsData } = useQuery({
		queryKey: queryKeys.notifications.list(false),
		queryFn: () => getNotifications(false),
		staleTime: STALE.NOTIFICATION,
	});

	const isLoading = loadingPending || loadingAccepted || loadingConnections || loadingSaved;
	const pendingInterests = pendingInterestsData?.items.length ?? 0;
	const acceptedInterests = acceptedInterestsData?.items.length ?? 0;
	const confirmedConnections = connectionsData?.items.length ?? 0;
	const savedCount = savedData?.items.length ?? 0;
	const recentNotifications = (notificationsData?.items ?? []).slice(0, 4) as Notification[];

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			{/* Welcome */}
			<div className="flex items-start justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-3xl font-bold text-(--sea-ink)">
						Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
					</h1>
					<p className="mt-1 text-muted-foreground">Find your perfect accommodation today</p>
				</div>
				{profile && (
					<div className="flex items-center gap-3 text-sm">
						{profile.average_rating > 0 && (
							<div className="flex items-center gap-1.5">
								<StarRating
									rating={profile.average_rating}
									size="sm"
								/>
								<span className="text-muted-foreground">
									{profile.average_rating.toFixed(1)} ({profile.rating_count})
								</span>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Email Verification Banner */}
			{!isEmailVerified && (
				<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-5 text-amber-600 shrink-0" />
							<div>
								<p className="font-semibold text-amber-800 dark:text-amber-200">Verify your email</p>
								<p className="text-sm text-amber-700 dark:text-amber-300">
									Unlock full access — send interest requests and connect with PG owners
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							asChild>
							<Link to="/profile">Verify Now</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Stats Grid */}
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={Heart}
					label="Pending Interests"
					value={pendingInterests}
					href="/interests"
					isLoading={isLoading}
					accent="rose"
				/>
				<StatCard
					icon={CheckCircle}
					label="Accepted Interests"
					value={acceptedInterests}
					href="/interests"
					isLoading={isLoading}
					accent="emerald"
				/>
				<StatCard
					icon={Users}
					label="Confirmed Stays"
					value={confirmedConnections}
					href="/connections"
					isLoading={isLoading}
					accent="blue"
				/>
				<StatCard
					icon={Bookmark}
					label="Saved Listings"
					value={savedCount}
					href="/saved"
					isLoading={isLoading}
					accent="violet"
				/>
			</div>

			{/* CTA */}
			<Card className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
				<CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
					<div>
						<h3 className="text-lg font-semibold">Find Your Perfect Room</h3>
						<p className="text-sm text-muted-foreground">
							Browse verified PGs, hostels, and shared listings with compatibility matching
						</p>
					</div>
					<Button
						size="lg"
						asChild
						className="shrink-0">
						<Link
							to="/browse"
							search={{}}>
							<Search className="size-4 mr-2" />
							Browse Listings
						</Link>
					</Button>
				</CardContent>
			</Card>

			{/* Recent Notifications */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Your latest notifications</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						asChild>
						<Link to="/notifications">
							View All
							<ArrowRight className="size-4 ml-1" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{recentNotifications.length === 0 ?
						<p className="text-center text-sm text-muted-foreground py-6">No new notifications</p>
					:	<div className="space-y-2">
							{recentNotifications.map((notification) => (
								<div
									key={notification.notificationId}
									className="flex items-start gap-3 rounded-lg p-3 bg-muted/40 hover:bg-muted/60 transition-colors">
									<div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium line-clamp-1">{notification.message}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{formatDistanceToNow(new Date(notification.createdAt), {
												addSuffix: true,
											})}
										</p>
									</div>
								</div>
							))}
						</div>
					}
				</CardContent>
			</Card>
		</div>
	);
}

function PgOwnerDashboard({ userId }: { userId: string }) {
	const { data: profile } = useQuery({
		queryKey: queryKeys.pgOwnerProfile(userId),
		queryFn: () => getPgOwnerProfile(userId),
		staleTime: STALE.PROFILE,
	});

	const { data: propertiesData, isLoading: loadingProperties } = useQuery({
		queryKey: queryKeys.properties(),
		queryFn: () => getMyProperties(),
		staleTime: STALE.FEED,
	});

	const { data: allConnectionsData, isLoading: loadingAllConns } = useQuery({
		queryKey: queryKeys.connections(),
		queryFn: () => getMyConnections(),
		staleTime: STALE.TRANSACTIONAL,
	});

	const { data: confirmedConnsData, isLoading: loadingConfirmed } = useQuery({
		queryKey: queryKeys.connections("confirmed"),
		queryFn: () => getMyConnections("confirmed"),
		staleTime: STALE.TRANSACTIONAL,
	});

	const { data: notificationsData } = useQuery({
		queryKey: queryKeys.notifications.list(false),
		queryFn: () => getNotifications(false),
		staleTime: STALE.NOTIFICATION,
	});

	const isLoading = loadingProperties || loadingAllConns || loadingConfirmed;

	const propertyCount = propertiesData?.items.length ?? 0;
	const activeListings = propertiesData?.items.reduce((sum, p) => sum + p.active_listing_count, 0) ?? 0;
	const confirmedConnections = confirmedConnsData?.items.length ?? 0;
	const pendingConnections = allConnectionsData?.items.filter((c) => c.confirmationStatus !== "confirmed").length ?? 0;
	const recentNotifications = (notificationsData?.items ?? []).slice(0, 4) as Notification[];
	const verificationStatus = profile?.verification_status || "unverified";

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			{/* Welcome */}
			<div className="flex items-start justify-between flex-wrap gap-4">
				<div>
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-3xl font-bold text-(--sea-ink)">
							Welcome{profile?.owner_full_name ? `, ${profile.owner_full_name.split(" ")[0]}` : ""}!
						</h1>
						<VerificationBadge status={verificationStatus} />
					</div>
					{profile?.business_name && <p className="mt-1 text-muted-foreground">{profile.business_name}</p>}
				</div>
				{profile && profile.average_rating > 0 && (
					<div className="flex items-center gap-1.5 text-sm">
						<StarRating
							rating={profile.average_rating}
							size="sm"
						/>
						<span className="text-muted-foreground">
							{profile.average_rating.toFixed(1)} ({profile.rating_count} reviews)
						</span>
					</div>
				)}
			</div>

			{/* Verification Banners */}
			{(verificationStatus === "unverified" || verificationStatus === "rejected") && (
				<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-5 text-amber-600 shrink-0" />
							<div>
								<p className="font-semibold text-amber-800 dark:text-amber-200">
									{verificationStatus === "rejected" ?
										"Verification rejected — resubmit documents"
									:	"Account not verified yet"}
								</p>
								<p className="text-sm text-amber-700 dark:text-amber-300">
									Upload documents to start receiving interest requests from students
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							asChild>
							<Link to="/profile">Upload Docs</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{verificationStatus === "pending" && (
				<Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950">
					<CardContent className="flex items-center gap-3 p-4">
						<Clock className="size-5 text-sky-600 shrink-0" />
						<div>
							<p className="font-semibold text-sky-800 dark:text-sky-200">Verification under review</p>
							<p className="text-sm text-sky-700 dark:text-sky-300">
								Our team will review your documents within 2–3 business days.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Stats Grid */}
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={Building2}
					label="Properties"
					value={propertyCount}
					href="/properties"
					isLoading={isLoading}
					accent="teal"
				/>
				<StatCard
					icon={Heart}
					label="Active Listings"
					value={activeListings}
					href="/listings"
					isLoading={isLoading}
					accent="rose"
				/>
				<StatCard
					icon={Clock}
					label="Pending Confirmations"
					value={pendingConnections}
					href="/connections"
					isLoading={isLoading}
					accent="amber"
				/>
				<StatCard
					icon={Users}
					label="Confirmed Stays"
					value={confirmedConnections}
					href="/connections"
					isLoading={isLoading}
					accent="emerald"
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card className="hover:shadow-md transition-shadow cursor-pointer">
					<CardContent className="flex items-center justify-between p-5">
						<div>
							<h3 className="font-semibold">Add New Property</h3>
							<p className="text-sm text-muted-foreground">Register a PG, hostel or apartment</p>
						</div>
						<Button asChild>
							<Link to="/properties">
								<Plus className="size-4 mr-1.5" />
								Add Property
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow cursor-pointer">
					<CardContent className="flex items-center justify-between p-5">
						<div>
							<h3 className="font-semibold">Manage Listings</h3>
							<p className="text-sm text-muted-foreground">Create rooms and view interest requests</p>
						</div>
						<Button
							variant="outline"
							asChild>
							<Link
								to="/listings"
								search={{ property_id: undefined }}>
								<Heart className="size-4 mr-1.5" />
								View Interests
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Recent Notifications */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<div>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Latest interest requests and updates</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						asChild>
						<Link to="/notifications">
							View All
							<ArrowRight className="size-4 ml-1" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{recentNotifications.length === 0 ?
						<p className="text-center text-sm text-muted-foreground py-6">No new notifications</p>
					:	<div className="space-y-2">
							{recentNotifications.map((notification) => (
								<Link
									key={notification.notificationId}
									to="/notifications"
									className="flex items-start gap-3 rounded-lg p-3 bg-muted/40 hover:bg-muted/60 transition-colors">
									<div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium line-clamp-1">{notification.message}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{formatDistanceToNow(new Date(notification.createdAt), {
												addSuffix: true,
											})}
										</p>
									</div>
								</Link>
							))}
						</div>
					}
				</CardContent>
			</Card>
		</div>
	);
}

type AccentColor = "rose" | "emerald" | "blue" | "violet" | "amber" | "teal";

const ACCENT_STYLES: Record<AccentColor, string> = {
	rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
	emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
	blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
	violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
	amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
	teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
};

function StatCard({
	icon: Icon,
	label,
	value,
	href,
	isLoading,
	accent = "blue",
}: {
	icon: typeof Heart;
	label: string;
	value: number;
	href: string;
	isLoading: boolean;
	accent?: AccentColor;
}) {
	return (
		<Link to={href as "/"}>
			<Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
				<CardContent className="flex items-center gap-3 p-5">
					<div className={`flex size-11 items-center justify-center rounded-xl ${ACCENT_STYLES[accent]}`}>
						<Icon className="size-5" />
					</div>
					<div>
						<p className="text-2xl font-bold">{isLoading ? "—" : value}</p>
						<p className="text-xs text-muted-foreground leading-tight">{label}</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function VerificationBadge({ status }: { status: string }) {
	switch (status) {
		case "verified":
			return (
				<Badge
					variant="success"
					className="gap-1">
					<CheckCircle className="size-3" />
					Verified
				</Badge>
			);
		case "pending":
			return (
				<Badge
					variant="warning"
					className="gap-1">
					<Clock className="size-3" />
					Under Review
				</Badge>
			);
		case "rejected":
			return (
				<Badge
					variant="destructive"
					className="gap-1">
					<AlertCircle className="size-3" />
					Rejected
				</Badge>
			);
		default:
			return <Badge variant="secondary">Unverified</Badge>;
	}
}
