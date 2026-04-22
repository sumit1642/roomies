// src/routes/_auth/_student/preferences.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { toast } from "#/components/ui/sonner";
import { useAuth } from "#/context/AuthContext";
import { PreferencePicker } from "#/components/PreferencePicker";
import { getStudentPreferences, updateStudentPreferences } from "#/lib/api/profiles";
import type { PreferencePair } from "#/types";

export const Route = createFileRoute("/_auth/_student/preferences")({
	component: PreferencesPage,
	head: () => ({
		meta: [{ title: "Preferences - Roomies" }],
	}),
});

function PreferencesPage() {
	const { user } = useAuth();
	const [preferences, setPreferences] = useState<PreferencePair[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!user?.userId) return;
		getStudentPreferences(user.userId)
			.then(setPreferences)
			.catch(() => toast.error("Failed to load preferences"))
			.finally(() => setIsLoading(false));
	}, [user?.userId]);

	const handleSave = async () => {
		if (!user?.userId) return;
		setIsSaving(true);
		try {
			await updateStudentPreferences(user.userId, preferences);
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

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Lifestyle Preferences</h1>
				<p className="mt-2 text-muted-foreground">
					Set your preferences to improve roommate and listing compatibility scores
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Your Preferences</CardTitle>
					<CardDescription>
						These are used to match you with compatible listings and roommates. You can update them at any
						time.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PreferencePicker
						value={preferences}
						onChange={setPreferences}
						disabled={isSaving}
						allowClear
					/>
				</CardContent>
			</Card>

			<div className="mt-6 flex justify-end">
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
