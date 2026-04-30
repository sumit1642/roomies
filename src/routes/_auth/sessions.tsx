// src/routes/_auth/sessions.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Monitor, ShieldCheck, Trash2, LogOut, Clock, AlertCircle } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { toast } from "#/components/ui/sonner";
import { getSessions, revokeSession, logoutAll } from "#/lib/api/auth";
import { useAuth } from "#/context/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import type { SessionItem } from "#/types";

export const Route = createFileRoute("/_auth/sessions")({
	component: SessionsPage,
	head: () => ({
		meta: [{ title: "Active Sessions - Roomies" }],
	}),
});

function SessionsPage() {
	const { logout } = useAuth();
	const [sessions, setSessions] = useState<SessionItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [revokingId, setRevokingId] = useState<string | null>(null);
	const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
	const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

	useEffect(() => {
		getSessions()
			.then(setSessions)
			.catch(() => toast.error("Failed to load sessions"))
			.finally(() => setIsLoading(false));
	}, []);

	const handleRevoke = async (sid: string) => {
		setRevokingId(sid);
		try {
			await revokeSession(sid);
			setSessions((prev) => prev.filter((s) => s.sid !== sid));
			toast.success("Session revoked successfully.");
		} catch {
			toast.error("Failed to revoke session.");
		} finally {
			setRevokingId(null);
			setConfirmRevoke(null);
		}
	};

	const handleLogoutAll = async () => {
		try {
			await logoutAll();
			await logout();
			toast.success("Logged out from all sessions.");
		} catch {
			toast.error("Failed to log out from all sessions.");
		} finally {
			setConfirmLogoutAll(false);
		}
	};

	const currentSession = sessions.find((s) => s.isCurrent);
	const otherSessions = sessions.filter((s) => !s.isCurrent);

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			{/* Page Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div>
						<h1 className="text-3xl font-bold flex items-center gap-2">
							<ShieldCheck className="size-8 text-primary" />
							Active Sessions
						</h1>
						<p className="mt-2 text-muted-foreground">
							Manage all devices currently logged into your Roomies account
						</p>
					</div>
					{sessions.length > 1 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setConfirmLogoutAll(true)}
							className="gap-2">
							<LogOut className="size-4" />
							Logout All Devices
						</Button>
					)}
				</div>
			</div>

			{isLoading ?
				<div className="flex items-center justify-center py-20">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			: sessions.length === 0 ?
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
						<AlertCircle className="size-10 text-muted-foreground" />
						<p className="text-muted-foreground">No sessions found.</p>
					</CardContent>
				</Card>
			:	<div className="space-y-6">
					{/* Current Session */}
					{currentSession && (
						<section>
							<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
								Current Session
							</h2>
							<SessionCard
								session={currentSession}
								onRevoke={() => {}}
								isRevoking={false}
								isCurrent
							/>
						</section>
					)}

					{/* Other Sessions */}
					{otherSessions.length > 0 && (
						<section>
							<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
								Other Sessions ({otherSessions.length})
							</h2>
							<div className="space-y-3">
								{otherSessions.map((session) => (
									<SessionCard
										key={session.sid}
										session={session}
										onRevoke={() => setConfirmRevoke(session.sid)}
										isRevoking={revokingId === session.sid}
									/>
								))}
							</div>
						</section>
					)}

					{/* Security tip */}
					<Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
						<CardContent className="flex items-start gap-3 p-4">
							<AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="text-sm">
								<p className="font-semibold text-amber-800 dark:text-amber-200">Security tip</p>
								<p className="text-amber-700 dark:text-amber-300">
									If you see a session you don&apos;t recognise, revoke it immediately and change your
									password.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			}

			{/* Confirm revoke single session */}
			<ConfirmDialog
				open={!!confirmRevoke}
				onOpenChange={() => setConfirmRevoke(null)}
				title="Revoke this session?"
				description="The device using this session will be logged out immediately."
				confirmLabel="Revoke"
				onConfirm={() => confirmRevoke && handleRevoke(confirmRevoke)}
				variant="destructive"
			/>

			{/* Confirm logout all */}
			<ConfirmDialog
				open={confirmLogoutAll}
				onOpenChange={setConfirmLogoutAll}
				title="Logout from all devices?"
				description="You will be logged out from every device, including this one. You'll need to log in again."
				confirmLabel="Logout All"
				onConfirm={handleLogoutAll}
				variant="destructive"
			/>
		</div>
	);
}

function SessionCard({
	session,
	onRevoke,
	isRevoking,
	isCurrent = false,
}: {
	session: SessionItem;
	onRevoke: () => void;
	isRevoking: boolean;
	isCurrent?: boolean;
}) {
	const expiresAt = new Date(session.expiresAt);
	const issuedAt = session.issuedAt ? new Date(session.issuedAt) : null;
	const isExpired = expiresAt < new Date();

	return (
		<Card className={isCurrent ? "border-primary/40 bg-primary/5" : ""}>
			<CardHeader className="pb-2 pt-4 px-4">
				<div className="flex items-start justify-between gap-3 flex-wrap">
					<div className="flex items-center gap-3">
						<div
							className={`flex size-10 items-center justify-center rounded-xl ${isCurrent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
							<Monitor className="size-5" />
						</div>
						<div>
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								Session
								{isCurrent && (
									<Badge
										variant="success"
										className="text-xs">
										Current
									</Badge>
								)}
								{isExpired && !isCurrent && (
									<Badge
										variant="secondary"
										className="text-xs">
										Expired
									</Badge>
								)}
							</CardTitle>
							<CardDescription className="text-xs font-mono mt-0.5 truncate max-w-50">
								{session.sid.slice(0, 16)}…
							</CardDescription>
						</div>
					</div>
					{!isCurrent && (
						<Button
							size="sm"
							variant="outline"
							className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
							onClick={onRevoke}
							disabled={isRevoking}>
							{isRevoking ?
								<Loader2 className="size-3.5 animate-spin" />
							:	<Trash2 className="size-3.5" />}
							Revoke
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="px-4 pb-4">
				<div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
					{issuedAt && (
						<div className="flex items-center gap-1.5">
							<Clock className="size-3 shrink-0" />
							<span>Started {formatDistanceToNow(issuedAt, { addSuffix: true })}</span>
						</div>
					)}
					<div className="flex items-center gap-1.5">
						<Clock className="size-3 shrink-0" />
						<span>
							{isExpired ? "Expired" : "Expires"} {format(expiresAt, "MMM d, yyyy · HH:mm")}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
