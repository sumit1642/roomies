import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/_pgowner")({
	beforeLoad: ({ context }) => {
		if (context.auth.role !== "pg_owner") {
			throw redirect({ to: "/dashboard", replace: true });
		}
	},
	component: PgOwnerLayout,
});

function PgOwnerLayout() {
	return <Outlet />;
}
