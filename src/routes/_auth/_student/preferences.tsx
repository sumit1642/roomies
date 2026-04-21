import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Label } from "#/components/ui/label";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { toast } from "#/components/ui/sonner";
import { useAuth } from "#/context/AuthContext";
import { EmptyState } from "#/components/EmptyState";
import { getPreferencesMeta, getStudentPreferences, updateStudentPreferences } from "#/lib/api/profiles";
import type { PreferenceMetaItem, PreferencePair, PreferenceKey } from "#/types";

export const Route = createFileRoute("/_auth/_student/preferences")({
	component: PreferencesPage,
	head: () => ({
		meta: [{ title: "Preferences - Roomies" }],
	}),
});

function PreferencesPage() {
	const { user } = useAuth();
	const [meta, setMeta] = useState<PreferenceMetaItem[]>([]);
	const [preferences, setPreferences] = useState<Record<PreferenceKey, string>>({} as Record<PreferenceKey, string>);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		async function fetchData() {
			if (!user?.userId) return;
			try {
				const [metaData, prefsData] = await Promise.all([
					getPreferencesMeta(),
					getStudentPreferences(user.userId),
				]);
				setMeta(metaData);

				const prefsMap: Record<PreferenceKey, string> = {} as Record<PreferenceKey, string>;
				for (const pref of prefsData) {
					prefsMap[pref.preferenceKey] = pref.preferenceValue;
				}
				setPreferences(prefsMap);
			} catch {
				toast.error("Failed to load preferences");
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, [user?.userId]);

	const handleSave = async () => {
		if (!user?.userId) return;
		setIsSaving(true);
		try {
			const prefsArray: PreferencePair[] = Object.entries(preferences)
				.filter(([_, value]) => value)
				.map(([key, value]) => ({
					preferenceKey: key as PreferenceKey,
					preferenceValue: value,
				}));

			await updateStudentPreferences(user.userId, prefsArray);
			toast.success("Preferences saved successfully");
		} catch {
			toast.error("Failed to save preferences");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (meta.length === 0) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<EmptyState
					title="No preferences available"
					description="Preference settings are not available at this time"
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Lifestyle Preferences</h1>
				<p className="mt-2 text-muted-foreground">
					Set your preferences to get better compatibility scores on listings
				</p>
			</div>

			<div className="space-y-6">
				{meta.map((item) => (
					<Card key={item.preferenceKey}>
						<CardHeader>
							<CardTitle className="text-lg">{item.label}</CardTitle>
						</CardHeader>
						<CardContent>
							<RadioGroup
								value={preferences[item.preferenceKey] || ""}
								onValueChange={(value) =>
									setPreferences({ ...preferences, [item.preferenceKey]: value })
								}
								className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{item.values.map((option) => (
									<div
										key={option.value}
										className="flex items-center space-x-2">
										<RadioGroupItem
											value={option.value}
											id={`${item.preferenceKey}-${option.value}`}
										/>
										<Label
											htmlFor={`${item.preferenceKey}-${option.value}`}
											className="font-normal cursor-pointer">
											{option.label}
										</Label>
									</div>
								))}
							</RadioGroup>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8 flex justify-end">
				<Button
					size="lg"
					onClick={handleSave}
					disabled={isSaving}>
					{isSaving ?
						<>
							<Loader2 className="size-4 animate-spin" />
							Saving...
						</>
					:	<>
							<Save className="size-4" />
							Save Preferences
						</>
					}
				</Button>
			</div>
		</div>
	);
}
