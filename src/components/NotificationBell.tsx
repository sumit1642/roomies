import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { getUnreadCount } from "#/lib/api/notifications";

export function NotificationBell() {
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchUnreadCount = useCallback(async () => {
		try {
			const count = await getUnreadCount();
			setUnreadCount(count);
		} catch {
			// Silently fail - notifications not critical
		}
	}, []);

	useEffect(() => {
		fetchUnreadCount();

		// Poll every 60 seconds
		const interval = setInterval(fetchUnreadCount, 60000);
		return () => clearInterval(interval);
	}, [fetchUnreadCount]);

	return (
		<Button
			variant="ghost"
			size="icon"
			asChild
			className="relative">
			<Link to="/notifications">
				<Bell className="size-5" />
				{unreadCount > 0 && (
					<span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
				<span className="sr-only">Notifications ({unreadCount} unread)</span>
			</Link>
		</Button>
	);
}
