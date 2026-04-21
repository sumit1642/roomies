import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";

interface UserAvatarProps {
	name: string;
	photoUrl?: string | null;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

const sizeClasses = {
	sm: "size-8",
	md: "size-10",
	lg: "size-12",
	xl: "size-16",
};

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, photoUrl, size = "md", className }: UserAvatarProps) {
	return (
		<Avatar className={cn(sizeClasses[size], className)}>
			{photoUrl && (
				<AvatarImage
					src={photoUrl}
					alt={name}
				/>
			)}
			<AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(name)}</AvatarFallback>
		</Avatar>
	);
}
