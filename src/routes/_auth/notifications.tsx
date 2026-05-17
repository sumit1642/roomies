// src/routes/_auth/notifications.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/EmptyState";
import { LoadMoreButton } from "#/components/LoadMoreButton";
import { markAsRead } from "#/lib/api/notifications";
import { notificationsInfiniteQueryOptions } from "#/lib/queryOptions";
import { queryKeys } from "#/lib/queryKeys";
import type { Notification, Cursor, PaginatedResponse } from "#/types";
import type { InfiniteData } from "@tanstack/react-query";
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
	XCircle,
	Home,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/notifications")({
	component: NotificationsPage,
});

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
	const qc = useQueryClient();
	const [markingId, setMarkingId] = useState<string | null>(null);
	const [markingAll, setMarkingAll] = useState(false);

	const {
		data: notificationsData,
		isFetchingNextPage: isLoadingMore,
		fetchNextPage,
	} = useInfiniteQuery({
		...notificationsInfiniteQueryOptions(),
	});

	const notifications: Notification[] = notificationsData?.pages.flatMap((p) => p.items) ?? [];
	const lastPage = notificationsData?.pages[notificationsData.pages.length - 1];
	const nextCursor: Cursor | null = lastPage ? lastPage.nextCursor : null;

	// Helper: patch the cached notification list optimistically
	const patchCache = (updater: (prev: Notification[]) => Notification[]) => {
		qc.setQueryData<InfiniteData<PaginatedResponse<Notification>, Cursor | undefined>>(
			queryKeys.notifications.list(undefined),
			(old) =>
				old ? { ...old, pages: old.pages.map((page) => ({ ...page, items: updater(page.items) })) } : old,
		);
	};

	// Mark single notification as read
	const markSingleMutation = useMutation({
		mutationFn: (id: string) => markAsRead([id]),
		onMutate: (id) => {
			setMarkingId(id);
			patchCache((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
		},
		onError: () => {
			toast.error("Failed to mark as read");
		},
		onSettled: () => setMarkingId(null),
	});

	// Mark all notifications as read
	const markAllMutation = useMutation({
		mutationFn: () => markAsRead(),
		onMutate: () => {
			setMarkingAll(true);
			patchCache((prev) => prev.map((n) => ({ ...n, isRead: true })));
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
			toast.success("All notifications marked as read");
		},
		onError: () => {
			toast.error("Failed to mark all as read");
		},
		onSettled: () => setMarkingAll(false),
	});

	const handleLoadMore = async (_cursor: Cursor) => {
		try {
			await fetchNextPage();
		} catch {
			toast.error("Failed to load notifications");
		}
	};

	const handleNotificationClick = async (notification: Notification) => {
		if (!notification.isRead) {
			markSingleMutation.mutate(notification.notificationId);
		}
		const meta = getNotificationMeta(notification.type);
		if (meta.actionPath) {
			navigate({ to: meta.actionPath as "/" });
		}
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

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
						onClick={() => markAllMutation.mutate()}
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
														markSingleMutation.mutate(notification.notificationId);
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
