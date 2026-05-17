import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/_student")({
	beforeLoad: ({ context }) => {
		if (context.auth.role !== "student") {
			throw redirect({ to: "/dashboard", replace: true });
		}
	},
	component: StudentLayout,
});

function StudentLayout() {
	return <Outlet />;
}
