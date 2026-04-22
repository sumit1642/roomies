// src/components/PreferencePicker.tsx
// Reusable preference selector using radio buttons within each category.
// Used in: listing creation/edit (PG owner), student preference settings.
//
// For LISTINGS: the owner sets what kind of tenant they prefer.
// For STUDENTS: the student sets their own lifestyle preferences.
//
// The backend expects { preferenceKey, preferenceValue }[] arrays.

import { useState, useEffect } from "react";
import { getPreferencesMeta } from "#/lib/api/profiles";
import type { PreferenceMetaItem, PreferencePair, PreferenceKey } from "#/types";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Label } from "#/components/ui/label";
import { Button } from "#/components/ui/button";

interface PreferencePickerProps {
	/** Current selected preferences */
	value: PreferencePair[];
	/** Called whenever selections change */
	onChange: (prefs: PreferencePair[]) => void;
	disabled?: boolean;
	/** Show a "Clear" button per preference key */
	allowClear?: boolean;
}

export function PreferencePicker({ value, onChange, disabled = false, allowClear = true }: PreferencePickerProps) {
	const [meta, setMeta] = useState<PreferenceMetaItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getPreferencesMeta()
			.then(setMeta)
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	// Build a lookup map for fast reads
	const valueMap = value.reduce<Record<string, string>>((acc, pref) => {
		acc[pref.preferenceKey] = pref.preferenceValue;
		return acc;
	}, {});

	const handleSelect = (key: PreferenceKey, val: string) => {
		const updated = value.filter((p) => p.preferenceKey !== key);
		updated.push({ preferenceKey: key, preferenceValue: val });
		onChange(updated);
	};

	const handleClear = (key: PreferenceKey) => {
		onChange(value.filter((p) => p.preferenceKey !== key));
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="h-8 rounded bg-muted animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (!meta.length) {
		return <p className="text-sm text-muted-foreground">No preference categories available</p>;
	}

	return (
		<div className="space-y-5">
			{meta.map((item) => {
				const selected = valueMap[item.preferenceKey];
				return (
					<div
						key={item.preferenceKey}
						className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{item.label}</p>
							{allowClear && selected && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs text-muted-foreground"
									onClick={() => handleClear(item.preferenceKey as PreferenceKey)}
									disabled={disabled}>
									Clear
								</Button>
							)}
						</div>
						<RadioGroup
							value={selected ?? ""}
							onValueChange={(val) => handleSelect(item.preferenceKey as PreferenceKey, val)}
							disabled={disabled}
							className="flex flex-wrap gap-3">
							{item.values.map((option) => (
								<div
									key={option.value}
									className="flex items-center gap-1.5">
									<RadioGroupItem
										value={option.value}
										id={`pref-${item.preferenceKey}-${option.value}`}
									/>
									<Label
										htmlFor={`pref-${item.preferenceKey}-${option.value}`}
										className="text-sm font-normal cursor-pointer select-none">
										{option.label}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>
				);
			})}
		</div>
	);
}
