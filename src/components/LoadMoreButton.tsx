import { Loader2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { Cursor } from "#/types";

interface LoadMoreButtonProps {
	nextCursor: Cursor | null;
	isLoading: boolean;
	onLoadMore: (cursor: Cursor) => void;
}

export function LoadMoreButton({ nextCursor, isLoading, onLoadMore }: LoadMoreButtonProps) {
	if (!nextCursor) return null;

	return (
		<div className="flex justify-center py-4">
			<Button
				variant="outline"
				onClick={() => onLoadMore(nextCursor)}
				disabled={isLoading}>
				{isLoading ?
					<>
						<Loader2 className="size-4 animate-spin" />
						Loading...
					</>
				:	"Load More"}
			</Button>
		</div>
	);
}
