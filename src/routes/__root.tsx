import { HeadContent, Outlet, Scripts, createRootRoute, Link } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "#/context/AuthContext";
import { queryClient } from "#/lib/queryClient";
import { Toaster } from "#/components/ui/sonner";
import { Home } from "lucide-react";
import { Button } from "#/components/ui/button";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Roomies - Find Your PG or Roommate",
			},
			{
				name: "description",
				content: "Trust-first student roommate and PG discovery platform for India",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	notFoundComponent: NotFoundPage,
	component: RootComponent,
});

function NotFoundPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
			<div className="mb-6">
				<div className="flex size-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
					<span className="text-3xl">🏠</span>
				</div>
				<h1 className="text-4xl font-bold text-(--sea-ink) mb-2">404</h1>
				<h2 className="text-xl font-semibold text-(--sea-ink) mb-2">Page Not Found</h2>
				<p className="text-muted-foreground max-w-sm mx-auto">
					The page you&apos;re looking for doesn&apos;t exist or has been moved.
				</p>
			</div>
			<div className="flex gap-3">
				<Button asChild>
					<Link to="/">
						<Home className="size-4" />
						Go Home
					</Link>
				</Button>
				<Button
					variant="outline"
					onClick={() => window.history.back()}>
					Go Back
				</Button>
			</div>
		</div>
	);
}

function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<RootDocument>
					<Outlet />
				</RootDocument>
			</AuthProvider>
		</QueryClientProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className="bg-background"
			suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]">
				{children}
				<Toaster
					position="top-right"
					richColors
				/>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Analytics />
				<Scripts />
			</body>
		</html>
	);
}
