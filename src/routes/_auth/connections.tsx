// src/routes/_auth/connections.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { UserAvatar } from "#/components/UserAvatar";
import { EmptyState } from "#/components/EmptyState";
import { connectionsApi } from "#/lib/api/connections";
import { useAuth } from "#/context/AuthContext";
import type { Connection } from "#/types";
import { toast } from "#/components/ui/sonner";
import { Users, Check, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_auth/connections")({
	component: ConnectionsPage,
});

// Backend confirmation statuses mapped from the connections API
const PENDING = "pending";
const CONFIRMED = "confirmed";

function ConnectionsPage() {
	const { user } = useAuth();
	const [connections, setConnections] = useState<Connection[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed">("all");
	const [processingId, setProcessingId] = useState<string | null>(null);

	useEffect(() => {
		fetchConnections();
	}, []);

	const fetchConnections = async () => {
		try {
			setIsLoading(true);
			const response = await connectionsApi.getMyConnections();
			if (response.success && response.data) {
				setConnections(response.data);
			}
		} catch {
			toast.error("Failed to load connections");
		} finally {
			setIsLoading(false);
		}
	};

	// confirmConnection = records that THIS user's side of the real-world meeting happened
	// Both parties must call this for status to become "confirmed"
	const handleConfirm = async (connectionId: string) => {
		setProcessingId(connectionId);
		try {
			const response = await connectionsApi.acceptConnection(connectionId);
			if (response.success) {
				toast.success("Connection confirmed from your side!");
				fetchConnections();
			} else {
				toast.error(response.message || "Failed to confirm connection");
			}
		} catch {
			toast.error("An error occurred");
		} finally {
			setProcessingId(null);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case PENDING:
				return (
					<Badge variant="warning">
						<Clock className="mr-1 h-3 w-3" />
						Pending
					</Badge>
				);
			case CONFIRMED:
				return (
					<Badge variant="success">
						<Check className="mr-1 h-3 w-3" />
						Confirmed
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const filteredConnections = connections.filter((conn) => {
		if (activeTab === "pending") return conn.status === PENDING;
		if (activeTab === "confirmed") return conn.status === CONFIRMED;
		return true;
	});

	const pendingCount = connections.filter((c) => c.status === PENDING).length;
	const confirmedCount = connections.filter((c) => c.status === CONFIRMED).length;
	const isStudent = user?.roles?.includes("student");

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Connections</h1>
				<p className="text-muted-foreground">
					{isStudent ? "Your connections with PG owners" : "Your connections with students"}
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
				<TabsList>
					<TabsTrigger value="all">All ({connections.length})</TabsTrigger>
					<TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
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
								:	"When students express interest in your listings, connections appear here."
							}
						/>
					:	<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredConnections.map((connection) => (
								<Card key={connection.id}>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<UserAvatar
													name={connection.other_user?.name || "User"}
													photoUrl={connection.other_user?.avatar_url}
													size="md"
												/>
												<div>
													<CardTitle className="text-base">
														{connection.other_user?.name || "Unknown User"}
													</CardTitle>
													<CardDescription className="text-xs">
														{isStudent ? "PG Owner" : "Student"}
													</CardDescription>
												</div>
											</div>
											{getStatusBadge(connection.status)}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										{connection.listing && (
											<div className="p-3 bg-muted rounded-lg">
												<p className="text-sm font-medium line-clamp-1">
													{connection.listing.title}
												</p>
												{connection.listing.property?.name && (
													<p className="text-xs text-muted-foreground">
														{connection.listing.property.name}
													</p>
												)}
											</div>
										)}

										<p className="text-xs text-muted-foreground">
											{formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
										</p>

										{/* Confirm button: available when connection is pending,
										    allows the current user to record their side of the meeting */}
										{connection.status === PENDING && (
											<div className="pt-2 border-t">
												<Button
													size="sm"
													className="w-full"
													onClick={() => handleConfirm(connection.id)}
													disabled={processingId === connection.id}>
													{processingId === connection.id ?
														<Loader2 className="size-4 animate-spin mr-2" />
													:	<Check className="mr-2 h-4 w-4" />}
													Confirm My Side
												</Button>
												<p className="text-xs text-muted-foreground mt-1 text-center">
													Tap when you've met in person
												</p>
											</div>
										)}

										{/* Show contact info for confirmed connections */}
										{connection.status === CONFIRMED && connection.other_user?.email && (
											<div className="pt-2 border-t">
												<a
													href={`mailto:${connection.other_user.email}`}
													className="text-sm text-primary hover:underline">
													{connection.other_user.email}
												</a>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					}
				</TabsContent>
			</Tabs>
		</div>
	);
}
