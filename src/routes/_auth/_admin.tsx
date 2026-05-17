// src/routes/_auth/_admin.tsx
// Admin layout route — guards the entire /_auth/_admin/* sub-tree.
// Redirects non-admins back to /dashboard immediately.

import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { ShieldAlert, ClipboardCheck, Flag } from "lucide-react";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth/_admin")({
	beforeLoad: ({ context }) => {
		if (context.auth.role !== "admin") {
			throw redirect({ to: "/dashboard", replace: true });
		}
	},
	component: AdminLayout,
});

const NAV_LINKS = [
	{
		to: "/verification",
		label: "Verification Queue",
		icon: ClipboardCheck,
	},
	{
		to: "/reports",
		label: "Report Queue",
		icon: Flag,
	},
] as const;

function AdminLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<div className="mx-auto max-w-6xl px-4 py-8">
			{/* Admin header */}
			<div className="mb-8 flex items-center gap-3">
				<div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
					<ShieldAlert className="size-5 text-destructive" />
				</div>
				<div>
					<h1 className="text-2xl font-bold">Admin Panel</h1>
					<p className="text-sm text-muted-foreground">
						Manage verification requests and reported content
					</p>
				</div>
			</div>

			{/* Tab nav */}
			<nav className="mb-6 flex gap-1 border-b border-border">
				{NAV_LINKS.map(({ to, label, icon: Icon }) => {
					const isActive = pathname === to || pathname.startsWith(to);
					return (
						<Link
							key={to}
							to={to}
							className={cn(
								"flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
								isActive
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}>
							<Icon className="size-4" />
							{label}
						</Link>
					);
				})}
			</nav>

			<Outlet />
		</div>
	);
}
