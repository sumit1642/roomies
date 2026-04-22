// src/components/AmenityPicker.tsx
import { useState, useEffect } from "react";
import { getAmenities } from "#/lib/api/amenities";
import type { Amenity } from "#/types";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { toast } from "#/components/ui/sonner";

interface AmenityPickerProps {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
	utility: "Utility",
	safety: "Safety",
	comfort: "Comfort",
};

export function AmenityPicker({ selectedIds, onChange, disabled = false }: AmenityPickerProps) {
	const [amenities, setAmenities] = useState<Amenity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [amenitiesError, setAmenitiesError] = useState<unknown>(null);

	useEffect(() => {
		getAmenities()
			.then((data) => {
				setAmenities(data);
				setAmenitiesError(null);
			})
			.catch((err) => {
				console.error("[AmenityPicker] Failed to load amenities", err);
				setAmenitiesError(err);
				toast.error("Failed to load amenities", {
					description: "Please refresh and try again.",
				});
			})
			.finally(() => setIsLoading(false));
	}, []);

	const handleToggle = (amenityId: string, checked: boolean) => {
		if (checked) {
			onChange([...selectedIds, amenityId]);
		} else {
			onChange(selectedIds.filter((id) => id !== amenityId));
		}
	};

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="h-6 rounded bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (amenitiesError) {
		const errorMessage =
			amenitiesError instanceof Error && amenitiesError.message ?
				amenitiesError.message
			:	"Unable to load amenities.";

		return <p className="text-sm text-destructive">{errorMessage}</p>;
	}

	if (!amenities.length) {
		return <p className="text-sm text-muted-foreground">No amenities available</p>;
	}

	const grouped = amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
		const cat = a.category ?? "utility";
		(acc[cat] = acc[cat] ?? []).push(a);
		return acc;
	}, {});

	return (
		<div className="space-y-4">
			{Object.entries(grouped).map(([category, items]) => (
				<div key={category}>
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
						{CATEGORY_LABELS[category] ?? category}
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{items.map((amenity) => (
							<div
								key={amenity.amenityId}
								className="flex items-center gap-2">
								<Checkbox
									id={`amenity-${amenity.amenityId}`}
									checked={selectedIds.includes(amenity.amenityId)}
									onCheckedChange={(val) => handleToggle(amenity.amenityId, Boolean(val))}
									disabled={disabled}
								/>
								<Label
									htmlFor={`amenity-${amenity.amenityId}`}
									className="text-sm font-normal cursor-pointer select-none">
									{amenity.name}
								</Label>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
