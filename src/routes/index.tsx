import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Shield, MessageCircle, CheckCircle, Users, Building2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useAuth } from "#/context/AuthContext";

export const Route = createFileRoute("/")({
	component: LandingPage,
	head: () => ({
		meta: [{ title: "Roomies - Find Your PG or Roommate" }],
	}),
});

function LandingPage() {
	const { user } = useAuth();

	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-border/40 bg-(--header-bg) backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<Link
						to="/"
						className="flex items-center gap-2">
						<div className="flex size-9 items-center justify-center rounded-lg bg-(--lagoon) text-white">
							<Home className="size-5" />
						</div>
						<span className="text-xl font-bold text-(--sea-ink)">Roomies</span>
					</Link>
					<nav className="flex items-center gap-4">
						{user ?
							<Button asChild>
								<Link to="/dashboard">Go to Dashboard</Link>
							</Button>
						:	<>
								<Button
									variant="ghost"
									asChild>
									<Link to="/login">Sign In</Link>
								</Button>
								<Button asChild>
									<Link to="/register">Get Started</Link>
								</Button>
							</>
						}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative overflow-hidden py-20 md:py-32">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-3xl text-center">
						<p className="island-kicker mb-4">Trusted by 10,000+ students</p>
						<h1 className="display-title text-4xl font-bold tracking-tight text-(--sea-ink) md:text-6xl">
							Find Your Perfect <span className="text-(--lagoon-deep)">PG or Roommate</span>
						</h1>
						<p className="mt-6 text-lg text-(--sea-ink-soft) md:text-xl">
							India&apos;s trust-first platform for students to discover verified PGs, hostels, and
							compatible roommates. Connect safely via WhatsApp.
						</p>
						<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								size="lg"
								asChild
								className="w-full sm:w-auto">
								<Link to="/browse">
									<Users className="size-5" />
									Find a Room
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								asChild
								className="w-full sm:w-auto">
								<Link to="/register">
									<Building2 className="size-5" />
									List Your PG
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="border-t border-border/40 py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="display-title text-3xl font-bold text-(--sea-ink)">Why Choose Roomies?</h2>
						<p className="mt-4 text-(--sea-ink-soft)">Built for students, verified by trust</p>
					</div>
					<div className="mt-12 grid gap-6 md:grid-cols-3">
						<FeatureCard
							icon={Shield}
							title="Verified Listings"
							description="Every PG and roommate listing is verified to ensure authenticity and safety for students."
						/>
						<FeatureCard
							icon={CheckCircle}
							title="Trust Pipeline"
							description="Our unique rating system builds trust through real connections and verified stay confirmations."
						/>
						<FeatureCard
							icon={MessageCircle}
							title="WhatsApp Connect"
							description="Connect directly via WhatsApp after mutual interest. No spam, no hassle."
						/>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="border-t border-border/40 py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="display-title text-3xl font-bold text-(--sea-ink)">How It Works</h2>
					</div>
					<div className="mt-12 grid gap-8 md:grid-cols-4">
						<StepCard
							step={1}
							title="Create Profile"
							description="Sign up and tell us about yourself"
						/>
						<StepCard
							step={2}
							title="Browse Listings"
							description="Filter by city, rent, and preferences"
						/>
						<StepCard
							step={3}
							title="Express Interest"
							description="Send interest to listings you like"
						/>
						<StepCard
							step={4}
							title="Connect & Move In"
							description="Chat on WhatsApp and finalize your stay"
						/>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="border-t border-border/40 py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="island-shell mx-auto max-w-2xl rounded-2xl p-8 text-center md:p-12">
						<h2 className="display-title text-2xl font-bold text-(--sea-ink) md:text-3xl">
							Ready to Find Your New Home?
						</h2>
						<p className="mt-4 text-(--sea-ink-soft)">
							Join thousands of students who found their perfect accommodation through Roomies.
						</p>
						<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								size="lg"
								asChild>
								<Link to="/register">Create Free Account</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								asChild>
								<Link to="/browse">Browse Listings</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="site-footer py-12">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-(--lagoon) text-white">
								<Home className="size-4" />
							</div>
							<span className="font-semibold text-(--sea-ink)">Roomies</span>
						</div>
						<p className="text-sm text-(--sea-ink-soft)">
							&copy; {new Date().getFullYear()} Roomies. Made for students, by students.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
	return (
		<div className="feature-card rounded-xl border border-border/40 p-6 transition-all">
			<div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-(--lagoon)/10">
				<Icon className="size-6 text-(--lagoon-deep)" />
			</div>
			<h3 className="text-lg font-semibold text-(--sea-ink)">{title}</h3>
			<p className="mt-2 text-sm text-(--sea-ink-soft)">{description}</p>
		</div>
	);
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
	return (
		<div className="text-center">
			<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-(--lagoon) text-lg font-bold text-white">
				{step}
			</div>
			<h3 className="font-semibold text-(--sea-ink)">{title}</h3>
			<p className="mt-1 text-sm text-(--sea-ink-soft)">{description}</p>
		</div>
	);
}
