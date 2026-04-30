import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "#/components/ui/button";
import { getUnreadCount } from "#/lib/api/notifications";
import { queryKeys } from "#/lib/queryKeys";
import { STALE } from "#/lib/queryClient";

export function NotificationBell() {
	const { data: unreadCount = 0 } = useQuery({
		queryKey: queryKeys.notifications.unreadCount(),
		queryFn: getUnreadCount,
		staleTime: STALE.NOTIFICATION,
		// Still polls every 60 s — but now deduplicated + cached.
		// refetchIntervalInBackground: false → stops polling in unfocused tabs (key improvement).
		refetchInterval: 60_000,
		refetchIntervalInBackground: false,
	});

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
