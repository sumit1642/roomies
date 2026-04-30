import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "#/lib/queryClient";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		// Raised from 0 → 30s so intent-preload actually serves cached data
		defaultPreloadStaleTime: 30_000,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
	interface RouterContext {
		queryClient: typeof queryClient;
	}
}
