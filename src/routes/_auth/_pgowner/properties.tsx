// src/routes/_auth/_pgowner/properties.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { EmptyState } from "#/components/EmptyState";
import { ConfirmDialog } from "#/components/ConfirmDialog";
import { createProperty, updateProperty, deleteProperty, getMyProperties } from "#/lib/api/properties";
import { toast } from "#/components/ui/sonner";
import { Plus, Building2, MapPin, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import type { PropertyListItem } from "#/types";

export const Route = createFileRoute("/_auth/_pgowner/properties")({
	component: PropertiesPage,
});

// ─── Form data type ───────────────────────────────────────────────────────────
interface PropertyFormData {
	propertyName: string;
	addressLine: string;
	city: string;
	locality: string;
	pincode: string;
	description: string;
	propertyType: "pg" | "hostel" | "shared_apartment";
	houseRules: string;
}

// ─── PropertyForm defined OUTSIDE parent component ────────────────────────────
// IMPORTANT: Defining a component inside another component causes React to treat
// it as a new component type on every render, unmounting/remounting it and losing
// focus after each keystroke. Define it at module level and pass props instead.
interface PropertyFormProps {
	formData: PropertyFormData;
	onChange: (data: PropertyFormData) => void;
	onSubmit: (e: React.FormEvent) => void;
	isSubmitting: boolean;
	isEditing: boolean;
}

function PropertyForm({ formData, onChange, onSubmit, isSubmitting, isEditing }: PropertyFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="propertyName">Property Name *</Label>
				<Input
					id="propertyName"
					value={formData.propertyName}
					onChange={(e) => onChange({ ...formData, propertyName: e.target.value })}
					placeholder="e.g., Sunshine PG for Women"
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="propertyType">Property Type *</Label>
				<Select
					value={formData.propertyType}
					onValueChange={(value) =>
						onChange({ ...formData, propertyType: value as "pg" | "hostel" | "shared_apartment" })
					}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="pg">PG</SelectItem>
						<SelectItem value="hostel">Hostel</SelectItem>
						<SelectItem value="shared_apartment">Shared Apartment</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="addressLine">Address *</Label>
				<Input
					id="addressLine"
					value={formData.addressLine}
					onChange={(e) => onChange({ ...formData, addressLine: e.target.value })}
					placeholder="Street address"
					required
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="city">City *</Label>
					<Input
						id="city"
						value={formData.city}
						onChange={(e) => onChange({ ...formData, city: e.target.value })}
						placeholder="City"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="locality">Locality</Label>
					<Input
						id="locality"
						value={formData.locality}
						onChange={(e) => onChange({ ...formData, locality: e.target.value })}
						placeholder="Area / Locality"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="pincode">Pincode</Label>
				<Input
					id="pincode"
					value={formData.pincode}
					onChange={(e) => onChange({ ...formData, pincode: e.target.value })}
					placeholder="6-digit pincode"
					maxLength={6}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => onChange({ ...formData, description: e.target.value })}
					placeholder="Brief description of your property"
					rows={3}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="houseRules">House Rules</Label>
				<Textarea
					id="houseRules"
					value={formData.houseRules}
					onChange={(e) => onChange({ ...formData, houseRules: e.target.value })}
					placeholder="Rules for tenants"
					rows={2}
				/>
			</div>

			<DialogFooter>
				<Button
					type="submit"
					disabled={isSubmitting}>
					{isSubmitting ?
						<>
							<Loader2 className="size-4 animate-spin mr-2" />
							Saving...
						</>
					: isEditing ?
						"Update Property"
					:	"Create Property"}
				</Button>
			</DialogFooter>
		</form>
	);
}

// ─── Page component ───────────────────────────────────────────────────────────
function PropertiesPage() {
	const [properties, setProperties] = useState<PropertyListItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingProperty, setEditingProperty] = useState<PropertyListItem | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<PropertyListItem | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const defaultFormData: PropertyFormData = {
		propertyName: "",
		addressLine: "",
		city: "",
		locality: "",
		pincode: "",
		description: "",
		propertyType: "pg",
		houseRules: "",
	};

	const [formData, setFormData] = useState<PropertyFormData>(defaultFormData);

	useEffect(() => {
		fetchProperties();
	}, []);

	const fetchProperties = async () => {
		try {
			setIsLoading(true);
			const res = await getMyProperties();
			setProperties(res.items);
		} catch {
			toast.error("Failed to load properties");
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setFormData(defaultFormData);
	};

	const handleOpenCreate = () => {
		resetForm();
		setIsCreateOpen(true);
	};

	const handleOpenEdit = (property: PropertyListItem) => {
		setFormData({
			propertyName: property.property_name || "",
			addressLine: property.address_line || "",
			city: property.city || "",
			locality: property.locality || "",
			pincode: property.pincode || "",
			description: property.description || "",
			propertyType: property.property_type || "pg",
			houseRules: property.house_rules || "",
		});
		setEditingProperty(property);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.propertyName || !formData.addressLine || !formData.city) {
			toast.error("Property name, address, and city are required");
			return;
		}

		setIsSubmitting(true);
		try {
			if (editingProperty) {
				await updateProperty(editingProperty.property_id, {
					propertyName: formData.propertyName,
					addressLine: formData.addressLine,
					city: formData.city,
					locality: formData.locality || undefined,
					pincode: formData.pincode || undefined,
					description: formData.description || undefined,
					propertyType: formData.propertyType,
					houseRules: formData.houseRules || undefined,
				});
				toast.success("Property updated successfully");
				setEditingProperty(null);
			} else {
				await createProperty({
					propertyName: formData.propertyName,
					addressLine: formData.addressLine,
					city: formData.city,
					locality: formData.locality || undefined,
					pincode: formData.pincode || undefined,
					description: formData.description || undefined,
					propertyType: formData.propertyType,
					houseRules: formData.houseRules || undefined,
					amenityIds: [],
				});
				toast.success("Property created successfully");
				setIsCreateOpen(false);
			}
			fetchProperties();
		} catch {
			toast.error("Failed to save property");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteConfirm) return;
		try {
			await deleteProperty(deleteConfirm.property_id);
			toast.success("Property deleted successfully");
			setDeleteConfirm(null);
			fetchProperties();
		} catch {
			toast.error("Failed to delete property. Make sure it has no active listings.");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-100">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">My Properties</h1>
					<p className="text-muted-foreground">Manage your PG properties and add new ones</p>
				</div>
				<Dialog
					open={isCreateOpen}
					onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button onClick={handleOpenCreate}>
							<Plus className="mr-2 h-4 w-4" />
							Add Property
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Add New Property</DialogTitle>
							<DialogDescription>Add a new PG property to start creating room listings</DialogDescription>
						</DialogHeader>
						<PropertyForm
							formData={formData}
							onChange={setFormData}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
							isEditing={false}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{properties.length === 0 ?
				<EmptyState
					icon={Building2}
					title="No properties yet"
					description="Add your first PG property to start creating room listings."
					action={{ label: "Add Your First Property", onClick: handleOpenCreate }}
				/>
			:	<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{properties.map((property) => (
						<Card
							key={property.property_id}
							className="overflow-hidden">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<Building2 className="h-5 w-5 text-primary" />
										<CardTitle className="text-lg line-clamp-1">{property.property_name}</CardTitle>
									</div>
									<Badge variant={property.status === "active" ? "success" : "secondary"}>
										{property.status}
									</Badge>
								</div>
								<CardDescription className="flex items-center gap-1 mt-1">
									<MapPin className="h-3 w-3" />
									{property.city}
									{property.locality && `, ${property.locality}`}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex gap-3 text-sm text-muted-foreground">
									<span>{property.active_listing_count} active listings</span>
									<span>&bull;</span>
									<span>{property.amenity_count} amenities</span>
								</div>

								{property.description && (
									<p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
								)}

								<div className="flex items-center gap-2 pt-2">
									<Link
										to="/listings"
										search={{ property_id: property.property_id }}
										className="flex-1">
										<Button
											variant="outline"
											size="sm"
											className="w-full">
											<Eye className="mr-2 h-4 w-4" />
											Listings
										</Button>
									</Link>
									<Dialog
										open={editingProperty?.property_id === property.property_id}
										onOpenChange={(open) => !open && setEditingProperty(null)}>
										<DialogTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleOpenEdit(property)}>
												<Edit className="h-4 w-4" />
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
											<DialogHeader>
												<DialogTitle>Edit Property</DialogTitle>
												<DialogDescription>Update your property details</DialogDescription>
											</DialogHeader>
											<PropertyForm
												formData={formData}
												onChange={setFormData}
												onSubmit={handleSubmit}
												isSubmitting={isSubmitting}
												isEditing={true}
											/>
										</DialogContent>
									</Dialog>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setDeleteConfirm(property)}
										className="text-destructive hover:text-destructive">
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			}

			<ConfirmDialog
				open={!!deleteConfirm}
				onOpenChange={(open) => !open && setDeleteConfirm(null)}
				title="Delete Property"
				description={`Are you sure you want to delete "${deleteConfirm?.property_name}"? All listings must be removed first.`}
				confirmLabel="Delete"
				onConfirm={handleDelete}
				variant="destructive"
			/>
		</div>
	);
}
