import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/_student")({
	beforeLoad: () => {
		// Role check will be done by parent _auth layout
	},
	component: StudentLayout,
});

function StudentLayout() {
	return <Outlet />;
}
