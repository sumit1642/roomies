import type { LucideIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			{Icon && (
				<div className="mb-4 rounded-full bg-muted p-4">
					<Icon className="size-8 text-muted-foreground" />
				</div>
			)}
			<h3 className="text-lg font-semibold">{title}</h3>
			{description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
			{action && (
				<div className="mt-4">
					{action.href ?
						<Button asChild>
							<Link to={action.href}>{action.label}</Link>
						</Button>
					:	<Button onClick={action.onClick}>{action.label}</Button>}
				</div>
			)}
		</div>
	);
}
