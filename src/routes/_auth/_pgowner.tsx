import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/_pgowner")({
	beforeLoad: () => {
		// Role check will be done by parent _auth layout
	},
	component: PgOwnerLayout,
});

function PgOwnerLayout() {
	return <Outlet />;
}
