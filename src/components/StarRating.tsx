import { Star } from "lucide-react";
import { cn } from "#/lib/utils";

interface StarRatingProps {
	rating: number;
	maxRating?: number;
	size?: "sm" | "md" | "lg";
	showValue?: boolean;
	interactive?: boolean;
	onChange?: (rating: number) => void;
}

const sizeClasses = {
	sm: "size-3.5",
	md: "size-4",
	lg: "size-5",
};

export function StarRating({
	rating,
	maxRating = 5,
	size = "md",
	showValue = false,
	interactive = false,
	onChange,
}: StarRatingProps) {
	const stars = [];

	for (let i = 1; i <= maxRating; i++) {
		const filled = i <= Math.floor(rating);
		const halfFilled = !filled && i - 0.5 <= rating;

		stars.push(
			<button
				key={i}
				type="button"
				disabled={!interactive}
				onClick={() => interactive && onChange?.(i)}
				className={cn(
					"relative",
					interactive && "cursor-pointer hover:scale-110 transition-transform",
					!interactive && "cursor-default",
				)}>
				<Star
					className={cn(
						sizeClasses[size],
						"stroke-amber-400",
						filled ? "fill-amber-400"
						: halfFilled ? "fill-amber-400/50"
						: "fill-transparent",
					)}
				/>
			</button>,
		);
	}

	return (
		<div className="inline-flex items-center gap-0.5">
			{stars}
			{showValue && <span className="ml-1.5 text-sm text-muted-foreground">{rating.toFixed(1)}</span>}
		</div>
	);
}
