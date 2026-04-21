// src/routes/_auth/notifications.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/EmptyState";
import { notificationsApi, markAsRead } from "#/lib/api/notifications";
import type { Notification } from "#/types";
import { toast } from "#/components/ui/sonner";
import { Bell, BellOff, Check, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/notifications")({
	component: NotificationsPage,
});

function NotificationsPage() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchNotifications();
	}, []);

	const fetchNotifications = async () => {
		try {
			setIsLoading(true);
			const response = await notificationsApi.getNotifications();
			if (response.success && response.data) {
				setNotifications(response.data);
			}
		} catch {
			toast.error("Failed to load notifications");
		} finally {
			setIsLoading(false);
		}
	};

	// FIX: uses markAsRead([id]) instead of the non-existent per-notification endpoint
	const handleMarkAsRead = async (id: string) => {
		try {
			await markAsRead([id]);
			setNotifications((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
		} catch {
			toast.error("Failed to mark as read");
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAsRead(); // no args = { all: true }
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			toast.success("All notifications marked as read");
		} catch {
			toast.error("Failed to mark all as read");
		}
	};

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
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
						onClick={handleMarkAllAsRead}>
						<CheckCheck className="mr-2 h-4 w-4" />
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
			:	<div className="space-y-3">
					{notifications.map((notification) => (
						<Card
							key={notification.notificationId}
							className={cn(
								"transition-colors",
								!notification.isRead && "bg-primary/5 border-primary/20",
							)}>
							<CardContent className="p-4">
								<div className="flex items-start gap-4">
									<div
										className={cn(
											"p-2 rounded-full mt-0.5",
											!notification.isRead ? "bg-primary/10 text-primary" : (
												"bg-muted text-muted-foreground"
											),
										)}>
										<Bell className="h-4 w-4" />
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
									</div>
									{!notification.isRead && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleMarkAsRead(notification.notificationId)}>
											<Check className="h-4 w-4" />
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			}
		</div>
	);
}
