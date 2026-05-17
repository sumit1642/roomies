import { infiniteQueryOptions, mutationOptions, queryOptions } from "@tanstack/react-query";
import { getVerificationQueue, getReportQueue } from "#/lib/api/admin";
import { getMe } from "#/lib/api/auth";
import { getMyConnections } from "#/lib/api/connections";
import { getMyInterests } from "#/lib/api/interests";
import { getSavedListings, saveListing, searchListings, unsaveListing } from "#/lib/api/listings";
import { getNotifications } from "#/lib/api/notifications";
import { getRoommateFeed } from "#/lib/api/roommates";
import { STALE } from "#/lib/queryClient";
import { queryKeys } from "#/lib/queryKeys";
import type { ConfirmationStatus, Cursor, Gender, ListingFilters, ListingType, RequestStatus, RoomType, BedType } from "#/types";

export function authMeQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.auth.me(),
		queryFn: getMe,
		staleTime: STALE.PROFILE,
		retry: false,
	});
}

export function savedListingsQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.savedListings(),
		queryFn: () => getSavedListings(),
		staleTime: STALE.FEED,
	});
}

export function savedListingsInfiniteQueryOptions() {
	return infiniteQueryOptions({
		queryKey: queryKeys.savedListings(),
		queryFn: ({ pageParam }) => getSavedListings(pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.TRANSACTIONAL,
	});
}

export function notificationsInfiniteQueryOptions(isRead?: boolean) {
	return infiniteQueryOptions({
		queryKey: queryKeys.notifications.list(isRead),
		queryFn: ({ pageParam }) => getNotifications(isRead, pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.NOTIFICATION,
	});
}

export function studentInterestsInfiniteQueryOptions(status?: RequestStatus) {
	return infiniteQueryOptions({
		queryKey: queryKeys.interests(status),
		queryFn: ({ pageParam }) => getMyInterests(status, pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.TRANSACTIONAL,
	});
}

export function roommateFeedInfiniteQueryOptions() {
	return infiniteQueryOptions({
		queryKey: ["roommates", "feed"] as const,
		queryFn: ({ pageParam }) =>
			getRoommateFeed({
				cursorTime: pageParam?.cursorTime,
				cursorId: pageParam?.cursorId,
			}),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.FEED,
	});
}

export function connectionsInfiniteQueryOptions(status?: ConfirmationStatus) {
	return infiniteQueryOptions({
		queryKey: queryKeys.connections(status),
		queryFn: ({ pageParam }) => getMyConnections(status, pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.TRANSACTIONAL,
	});
}

export function adminVerificationQueueInfiniteQueryOptions() {
	return infiniteQueryOptions({
		queryKey: queryKeys.adminVerificationQueue(),
		queryFn: ({ pageParam }) => getVerificationQueue(pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export function adminReportQueueInfiniteQueryOptions() {
	return infiniteQueryOptions({
		queryKey: queryKeys.adminReportQueue(),
		queryFn: ({ pageParam }) => getReportQueue(pageParam),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export interface ListingFeedFilters {
	city?: string;
	listingType?: ListingType;
	minRent?: number;
	maxRent?: number;
	roomType?: RoomType;
	bedType?: BedType;
	preferredGender?: Gender;
	availableFrom?: string;
	amenityIds?: string[];
	sortBy?: "recent" | "compatibility";
	lat?: number;
	lng?: number;
	radius?: number;
}

export function listingFeedFiltersFromSearch(filters: ListingFilters): ListingFeedFilters {
	return {
		city: filters.city || undefined,
		roomType: filters.room_type,
		minRent: filters.min_rent,
		maxRent: filters.max_rent,
		preferredGender: filters.gender_preference,
		lat: filters.lat,
		lng: filters.lng,
		radius: filters.radius,
	};
}

export function listingsFeedQueryOptions(filters: ListingFeedFilters) {
	return infiniteQueryOptions({
		queryKey: queryKeys.listings(filters),
		queryFn: ({ pageParam }: { pageParam: Cursor | undefined }) =>
			searchListings({
				...filters,
				limit: 20,
				cursorTime: pageParam?.cursorTime,
				cursorId: pageParam?.cursorId,
			}),
		initialPageParam: undefined as Cursor | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		staleTime: STALE.FEED,
	});
}

export function toggleSavedListingMutationOptions() {
	return mutationOptions({
		mutationFn: async ({ listingId, isSaved }: { listingId: string; isSaved: boolean }) => {
			if (isSaved) {
				await unsaveListing(listingId);
				return;
			}

			await saveListing(listingId);
		},
	});
}
