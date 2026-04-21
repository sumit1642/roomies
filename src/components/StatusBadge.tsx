import { Badge } from "#/components/ui/badge";
import type { ListingStatus, RequestStatus, ConfirmationStatus, VerificationStatus, PropertyStatus } from "#/types";

type StatusType = ListingStatus | RequestStatus | ConfirmationStatus | VerificationStatus | PropertyStatus;

const statusConfig: Record<
	StatusType,
	{ variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"; label: string }
> = {
	// Listing statuses
	active: { variant: "success", label: "Active" },
	filled: { variant: "info", label: "Filled" },
	expired: { variant: "secondary", label: "Expired" },
	deactivated: { variant: "secondary", label: "Deactivated" },

	// Request statuses
	pending: { variant: "warning", label: "Pending" },
	accepted: { variant: "success", label: "Accepted" },
	declined: { variant: "destructive", label: "Declined" },
	withdrawn: { variant: "secondary", label: "Withdrawn" },

	// Confirmation statuses
	confirmed: { variant: "success", label: "Confirmed" },
	denied: { variant: "destructive", label: "Denied" },

	// Verification statuses
	unverified: { variant: "secondary", label: "Unverified" },
	verified: { variant: "success", label: "Verified" },
	rejected: { variant: "destructive", label: "Rejected" },

	// Property statuses
	inactive: { variant: "secondary", label: "Inactive" },
	under_review: { variant: "warning", label: "Under Review" },
};

interface StatusBadgeProps {
	status: StatusType;
	className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status] || { variant: "secondary" as const, label: status };

	return (
		<Badge
			variant={config.variant}
			className={className}>
			{config.label}
		</Badge>
	);
}
