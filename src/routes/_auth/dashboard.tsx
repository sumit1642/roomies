// src/routes/_auth/dashboard.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import type { Notification, StudentProfile, PgOwnerProfile } from "#/types";

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
	const [profile, setProfile] = useState<StudentProfile | null>(null);
	const [pendingInterests, setPendingInterests] = useState(0);
	const [confirmedConnections, setConfirmedConnections] = useState(0);
	const [savedCount, setSavedCount] = useState(0);
	const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!userId) return;
		async function fetchData() {
			try {
				const [profileData, interests, connections, saved, notifications] = await Promise.all([
					getStudentProfile(userId),
					getMyInterests("pending"),
					getMyConnections("confirmed"),
					getSavedListings(),
					getNotifications(false),
				]);

				setProfile(profileData);
				setPendingInterests(interests.items.length);
				setConfirmedConnections(connections.items.length);
				setSavedCount(saved.items.length);
				setRecentNotifications(notifications.items.slice(0, 3));
			} catch {
				// Silently handle errors
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [userId]);

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{/* Welcome Banner */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-(--sea-ink)">
					Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
				</h1>
				<p className="mt-1 text-muted-foreground">Find your perfect accommodation today</p>
			</div>

			{/* Email Verification Banner */}
			{!isEmailVerified && (
				<Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-5 text-amber-600" />
							<div>
								<p className="font-medium text-amber-800 dark:text-amber-200">
									Your email is not verified
								</p>
								<p className="text-sm text-amber-700 dark:text-amber-300">
									Verify your email to unlock full access to Roomies
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
			<div className="mb-8 grid gap-4 sm:grid-cols-3">
				<StatCard
					icon={Heart}
					label="Pending Interests"
					value={pendingInterests}
					href="/interests"
					isLoading={isLoading}
				/>
				<StatCard
					icon={Users}
					label="Confirmed Connections"
					value={confirmedConnections}
					href="/connections"
					isLoading={isLoading}
				/>
				<StatCard
					icon={Bookmark}
					label="Saved Listings"
					value={savedCount}
					href="/saved"
					isLoading={isLoading}
				/>
			</div>

			{/* CTA */}
			<Card className="mb-8">
				<CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
					<div>
						<h3 className="text-lg font-semibold">Find Your Perfect Room</h3>
						<p className="text-sm text-muted-foreground">
							Browse verified PGs, hostels, and roommate listings
						</p>
					</div>
					<Button
						size="lg"
						asChild>
						<Link
							to="/browse"
							search={{}}>
							<Search className="size-4" />
							Browse Listings
						</Link>
					</Button>
				</CardContent>
			</Card>

			{/* Recent Notifications */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Recent Notifications</CardTitle>
						<CardDescription>Stay updated on your activity</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						asChild>
						<Link to="/notifications">
							View All
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{recentNotifications.length === 0 ?
						<p className="text-center text-sm text-muted-foreground py-4">No new notifications</p>
					:	<div className="space-y-3">
							{recentNotifications.map((notification) => (
								<div
									key={notification.notificationId}
									className="flex items-start gap-3 rounded-lg border p-3">
									<div className="mt-0.5">
										<div className="size-2 rounded-full bg-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm">{notification.message}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{new Date(notification.createdAt).toLocaleDateString()}
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
	const [profile, setProfile] = useState<PgOwnerProfile | null>(null);
	const [activeListings, setActiveListings] = useState(0);
	const [confirmedConnections, setConfirmedConnections] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!userId) return;
		async function fetchData() {
			try {
				const [profileData, properties, connections] = await Promise.all([
					getPgOwnerProfile(userId),
					getMyProperties(),
					getMyConnections("confirmed"),
				]);

				setProfile(profileData);
				const listings = properties.items.reduce((sum, p) => sum + p.active_listing_count, 0);
				setActiveListings(listings);
				setConfirmedConnections(connections.items.length);
			} catch {
				// Silently handle errors
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [userId]);

	const verificationStatus = profile?.verification_status || "unverified";

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{/* Welcome Banner */}
			<div className="mb-8 flex items-start justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-3xl font-bold text-(--sea-ink)">
							Welcome{profile?.owner_full_name ? `, ${profile.owner_full_name.split(" ")[0]}` : ""}!
						</h1>
						<VerificationBadge status={verificationStatus} />
					</div>
					<p className="mt-1 text-muted-foreground">Manage your properties and listings</p>
				</div>
			</div>

			{/* Verification Banner */}
			{(verificationStatus === "unverified" || verificationStatus === "rejected") && (
				<Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<CardContent className="flex items-center justify-between p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-5 text-amber-600" />
							<div>
								<p className="font-medium text-amber-800 dark:text-amber-200">
									{verificationStatus === "rejected" ?
										"Your verification was rejected"
									:	"Your account is not verified"}
								</p>
								<p className="text-sm text-amber-700 dark:text-amber-300">
									Upload documents to get listed and receive interest requests
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							asChild>
							<Link to="/profile">Upload Documents</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{verificationStatus === "pending" && (
				<Card className="mb-6 border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950">
					<CardContent className="flex items-center gap-3 p-4">
						<Clock className="size-5 text-sky-600" />
						<div>
							<p className="font-medium text-sky-800 dark:text-sky-200">Verification under review</p>
							<p className="text-sm text-sky-700 dark:text-sky-300">
								We&apos;re reviewing your documents. This usually takes 1-2 business days.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Stats Grid */}
			<div className="mb-8 grid gap-4 sm:grid-cols-3">
				<StatCard
					icon={Building2}
					label="Active Listings"
					value={activeListings}
					href="/properties"
					isLoading={isLoading}
				/>
				<StatCard
					icon={Heart}
					label="Pending Requests"
					value={0}
					href="/properties"
					isLoading={isLoading}
				/>
				<StatCard
					icon={Users}
					label="Confirmed Stays"
					value={confirmedConnections}
					href="/connections"
					isLoading={isLoading}
				/>
			</div>

			{/* Quick Actions */}
			<div className="mb-8 grid gap-4 sm:grid-cols-2">
				<Card>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<h3 className="font-semibold">Add New Property</h3>
							<p className="text-sm text-muted-foreground">Register a new PG or hostel</p>
						</div>
						<Button asChild>
							<Link to="/properties">
								<Plus className="size-4" />
								Add Property
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center justify-between p-6">
						<div>
							<h3 className="font-semibold">Create Listing</h3>
							<p className="text-sm text-muted-foreground">Add a room or bed listing</p>
						</div>
						<Button
							variant="outline"
							asChild>
							<Link
								to="/listings"
								search={{ property_id: undefined }}>
								<Plus className="size-4" />
								New Listing
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	href,
	isLoading,
}: {
	icon: typeof Heart;
	label: string;
	value: number;
	href: string;
	isLoading: boolean;
}) {
	return (
		<Link to={href as "/interests" | "/connections" | "/saved" | "/properties"}>
			<Card className="transition-colors hover:bg-accent/50">
				<CardContent className="flex items-center gap-4 p-6">
					<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
						<Icon className="size-6 text-primary" />
					</div>
					<div>
						<p className="text-2xl font-bold">{isLoading ? "-" : value}</p>
						<p className="text-sm text-muted-foreground">{label}</p>
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
					Pending
				</Badge>
			);
		default:
			return (
				<Badge
					variant="secondary"
					className="gap-1">
					Unverified
				</Badge>
			);
	}
}
