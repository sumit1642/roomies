// src/routes/_auth/notifications.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { getNotifications, markAsRead } from "#/lib/api/notifications";
import type { Notification, Cursor } from "#/types";
import { toast } from "#/components/ui/sonner";
import {
	Bell,
	BellOff,
	Check,
	CheckCheck,
	Loader2,
	Heart,
	Users,
	Star,
	AlertCircle,
	CheckCircle,
	Clock,
	XCircle,
	Home,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/notifications")({
	component: NotificationsPage,
});

// Maps notification type to an icon and action path
function getNotificationMeta(type: string): {
	icon: typeof Bell;
	color: string;
	actionPath?: string;
} {
	switch (type) {
		case "interest_request_received":
			return { icon: Heart, color: "text-rose-500 bg-rose-50 dark:bg-rose-950", actionPath: "/listings" };
		case "interest_request_accepted":
			return {
				icon: CheckCircle,
				color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
				actionPath: "/interests",
			};
		case "interest_request_declined":
			return { icon: XCircle, color: "text-red-500 bg-red-50 dark:bg-red-950", actionPath: "/interests" };
		case "interest_request_withdrawn":
			return { icon: XCircle, color: "text-slate-500 bg-slate-50 dark:bg-slate-900", actionPath: "/listings" };
		case "connection_confirmed":
		case "connection_requested":
			return { icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950", actionPath: "/connections" };
		case "rating_received":
			return { icon: Star, color: "text-amber-500 bg-amber-50 dark:bg-amber-950", actionPath: "/connections" };
		case "listing_expiring":
		case "listing_expired":
		case "listing_filled":
			return { icon: Home, color: "text-primary bg-primary/10", actionPath: "/listings" };
		case "verification_approved":
			return {
				icon: CheckCircle,
				color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
				actionPath: "/profile",
			};
		case "verification_rejected":
		case "verification_pending":
			return { icon: AlertCircle, color: "text-amber-600 bg-amber-50 dark:bg-amber-950", actionPath: "/profile" };
		default:
			return { icon: Bell, color: "text-muted-foreground bg-muted" };
	}
}

function NotificationsPage() {
	const navigate = useNavigate();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [nextCursor, setNextCursor] = useState<Cursor | null>(null);
	const [markingId, setMarkingId] = useState<string | null>(null);
	const [markingAll, setMarkingAll] = useState(false);

	const fetchNotifications = async (cursor?: Cursor, append = false) => {
		try {
			const data = await getNotifications(undefined, cursor);
			if (append) {
				setNotifications((prev) => [...prev, ...data.items]);
			} else {
				setNotifications(data.items);
			}
			setNextCursor(data.nextCursor);
		} catch {
			toast.error("Failed to load notifications");
		}
	};

	useEffect(() => {
		fetchNotifications().finally(() => setIsLoading(false));
	}, []);

	const handleLoadMore = async (cursor: Cursor) => {
		setIsLoadingMore(true);
		await fetchNotifications(cursor, true);
		setIsLoadingMore(false);
	};

	const handleMarkAsRead = async (id: string) => {
		setMarkingId(id);
		try {
			await markAsRead([id]);
			setNotifications((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
		} catch {
			toast.error("Failed to mark as read");
		} finally {
			setMarkingId(null);
		}
	};

	const handleMarkAllAsRead = async () => {
		setMarkingAll(true);
		try {
			await markAsRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			toast.success("All notifications marked as read");
		} catch {
			toast.error("Failed to mark all as read");
		} finally {
			setMarkingAll(false);
		}
	};

	const handleNotificationClick = async (notification: Notification) => {
		// Mark as read
		if (!notification.isRead) {
			await markAsRead([notification.notificationId]).catch(() => {});
			setNotifications((prev) =>
				prev.map((n) => (n.notificationId === notification.notificationId ? { ...n, isRead: true } : n)),
			);
		}
		// Navigate to relevant page
		const meta = getNotificationMeta(notification.type);
		if (meta.actionPath) {
			navigate({ to: meta.actionPath as "/" });
		}
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
					<p className="text-muted-foreground">
						{unreadCount > 0 ?
							`You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
						:	"All caught up!"}
					</p>
				</div>
				{unreadCount > 0 && (
					<Button
						variant="outline"
						onClick={handleMarkAllAsRead}
						disabled={markingAll}>
						{markingAll ?
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						:	<CheckCheck className="mr-2 h-4 w-4" />}
						Mark All Read
					</Button>
				)}
			</div>

			{notifications.length === 0 ?
				<EmptyState
					icon={BellOff}
					title="No notifications"
					description="When you receive updates about your interests, connections, or listings, they will appear here."
				/>
			:	<>
					<div className="space-y-2">
						{notifications.map((notification) => {
							const meta = getNotificationMeta(notification.type);
							const Icon = meta.icon;
							return (
								<Card
									key={notification.notificationId}
									className={cn(
										"transition-colors cursor-pointer",
										!notification.isRead && "bg-primary/5 border-primary/20",
										meta.actionPath && "hover:shadow-sm",
									)}
									onClick={() => handleNotificationClick(notification)}>
									<CardContent className="p-4">
										<div className="flex items-start gap-4">
											<div className={cn("p-2 rounded-full mt-0.5 shrink-0", meta.color)}>
												<Icon className="h-4 w-4" />
											</div>
											<div className="flex-1 min-w-0">
												<p className={cn("text-sm", !notification.isRead && "font-medium")}>
													{notification.message}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													{formatDistanceToNow(new Date(notification.createdAt), {
														addSuffix: true,
													})}
												</p>
												{/* Show action hint */}
												{meta.actionPath && (
													<p className="text-xs text-primary mt-1 opacity-70">
														Click to view →
													</p>
												)}
											</div>
											{!notification.isRead && (
												<Button
													variant="ghost"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleMarkAsRead(notification.notificationId);
													}}
													disabled={markingId === notification.notificationId}
													className="shrink-0">
													{markingId === notification.notificationId ?
														<Loader2 className="h-4 w-4 animate-spin" />
													:	<Check className="h-4 w-4" />}
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
					<LoadMoreButton
						nextCursor={nextCursor}
						isLoading={isLoadingMore}
						onLoadMore={handleLoadMore}
					/>
				</>
			}
		</div>
	);
}
