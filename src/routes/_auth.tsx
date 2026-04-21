// src/routes/_auth.tsx
import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Home, Search, Heart, Users, Bookmark, User, Building2, Menu, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useAuth } from "#/context/AuthContext";
import { NotificationBell } from "#/components/NotificationBell";
import { UserAvatar } from "#/components/UserAvatar";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_auth")({
	component: AuthLayout,
});

function AuthLayout() {
	const { user, isLoading, role, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// FIX: was calling navigate() during render which causes React warning.
	// Move redirect into useEffect so it runs after render.
	useEffect(() => {
		if (!isLoading && !user) {
			navigate({ to: "/login" });
		}
	}, [isLoading, user, navigate]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-pulse text-muted-foreground">Loading...</div>
			</div>
		);
	}

	// While redirecting (user is null, not loading), show nothing
	if (!user) {
		return null;
	}

	const handleLogout = async () => {
		await logout();
		navigate({ to: "/" });
	};

	const studentNavItems = [
		{ href: "/dashboard", icon: Home, label: "Home" },
		{ href: "/browse", icon: Search, label: "Browse Listings" },
		{ href: "/interests", icon: Heart, label: "My Interests" },
		{ href: "/connections", icon: Users, label: "Connections" },
		{ href: "/saved", icon: Bookmark, label: "Saved" },
	];

	const pgOwnerNavItems = [
		{ href: "/dashboard", icon: Home, label: "Home" },
		{ href: "/properties", icon: Building2, label: "My Properties" },
		{ href: "/connections", icon: Users, label: "Connections" },
	];

	const navItems = role === "pg_owner" ? pgOwnerNavItems : studentNavItems;

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-border/40 bg-(--header-bg) backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					{/* Logo */}
					<Link
						to="/dashboard"
						className="flex items-center gap-2">
						<div className="flex size-9 items-center justify-center rounded-lg bg-(--lagoon) text-white">
							<Home className="size-5" />
						</div>
						<span className="text-xl font-bold text-(--sea-ink) hidden sm:block">Roomies</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center gap-1">
						{navItems.map((item) => (
							<NavLink
								key={item.href}
								href={item.href}
								icon={item.icon}
								label={item.label}
								isActive={location.pathname === item.href}
							/>
						))}
					</nav>

					{/* Right side actions */}
					<div className="flex items-center gap-2">
						<NotificationBell />

						{/* User menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="gap-2 px-2">
									<UserAvatar
										name={user?.email || "User"}
										size="sm"
									/>
									<ChevronDown className="size-4 text-muted-foreground hidden sm:block" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-56">
								<DropdownMenuLabel>
									<div className="flex flex-col gap-1">
										<span className="font-medium">{user?.email}</span>
										<span className="text-xs text-muted-foreground capitalize">
											{role === "pg_owner" ? "PG Owner" : "Student"}
										</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link
										to="/profile"
										className="cursor-pointer">
										<User className="size-4 mr-2" />
										Profile
									</Link>
								</DropdownMenuItem>
								{role === "student" && (
									<DropdownMenuItem asChild>
										<Link
											to="/preferences"
											className="cursor-pointer">
											<Heart className="size-4 mr-2" />
											Preferences
										</Link>
									</DropdownMenuItem>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									className="cursor-pointer text-destructive">
									<LogOut className="size-4 mr-2" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Mobile menu button */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
							<Menu className="size-5" />
							<span className="sr-only">Menu</span>
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-border/40 bg-background">
						<nav className="flex flex-col p-2">
							{navItems.map((item) => (
								<Link
									key={item.href}
									to={item.href}
									onClick={() => setIsMobileMenuOpen(false)}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										location.pathname === item.href ?
											"bg-accent text-accent-foreground"
										:	"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									)}>
									<item.icon className="size-4" />
									{item.label}
								</Link>
							))}
						</nav>
					</div>
				)}
			</header>

			{/* Main Content */}
			<main className="flex-1">
				<Outlet />
			</main>

			{/* Footer */}
			<footer className="site-footer py-6 mt-auto">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-sm text-muted-foreground">
							&copy; {new Date().getFullYear()} Roomies. Made for students.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

function NavLink({
	href,
	icon: Icon,
	label,
	isActive,
}: {
	href: string;
	icon: typeof Home;
	label: string;
	isActive: boolean;
}) {
	return (
		<Link
			to={href}
			className={cn(
				"flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
				isActive ?
					"bg-accent text-accent-foreground"
				:	"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
			)}>
			<Icon className="size-4" />
			<span className="hidden lg:inline">{label}</span>
		</Link>
	);
}
