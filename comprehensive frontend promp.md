Here's your comprehensive frontend prompt:

---

# Roomies Frontend — Complete Build Prompt

## What You're Building

A **role-aware React frontend** for Roomies — a trust-first student roommate and PG discovery platform for India. The app serves two roles: **Students** (find rooms, send interest, confirm stays, rate) and **PG Owners** (list properties/rooms, manage interest requests, confirm stays, rate students). The UI, navigation, forms, and data shown differ meaningfully by role.

**Stack:** TanStack Start + TanStack Router (file-based), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (new-york style), Zod for client-side validation, plain `fetch` for API calls.

**API base URL (dev):** `http://localhost:3000/api/v1`

**Auth transport:** Cookie mode (browser default — no `X-Client-Transport: bearer` header needed, tokens come as HttpOnly cookies).

---

## Core Principles

- **Prototype quality** — clean, readable Tailwind, no heavy animations, no complex design systems beyond what shadcn gives you. Functional first.
- **Role-aware rendering** — after login, `req.user.roles[0]` is either `"student"` or `"pg_owner"`. Every page, nav item, form, and CTA should reflect this.
- **TypeScript strict** — all API response shapes, enums, and form data must be typed from the backend contracts. No `any`.
- **Zod on the client** — all forms validate with Zod schemas derived from the backend validators before submitting.
- **Cookie auth** — the API sets HttpOnly cookies on login/register. The frontend never stores tokens. Silent refresh happens automatically via `authenticate` middleware on the backend. On a `401`, redirect to `/login`.
- **Money is always rupees in the UI** — the API sends rupees (already divided from paise). Display as `₹9,500`.
- **Pagination** — all feed endpoints use keyset cursors (`cursorTime` + `cursorId`). Use "Load More" buttons, not infinite scroll.
- **No admin pages.**

---

## TypeScript Type System

Create `src/types/` with these files. Everything flows from here.

### `src/types/enums.ts`
```ts
export type AccountStatus = "active" | "suspended" | "banned" | "deactivated";
export type Role = "student" | "pg_owner" | "admin";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type ListingType = "student_room" | "pg_room" | "hostel_bed";
export type RoomType = "single" | "double" | "triple" | "entire_flat";
export type BedType = "single_bed" | "double_bed" | "bunk_bed";
export type ListingStatus = "active" | "filled" | "expired" | "deactivated";
export type PropertyType = "pg" | "hostel" | "shared_apartment";
export type PropertyStatus = "active" | "inactive" | "under_review";
export type RequestStatus = "pending" | "accepted" | "declined" | "withdrawn" | "expired";
export type ConfirmationStatus = "pending" | "confirmed" | "denied" | "expired";
export type ConnectionType = "student_roommate" | "pg_stay" | "hostel_stay" | "visit_only";
export type RevieweeType = "user" | "property";
export type ReportReason = "fake" | "abusive" | "conflict_of_interest" | "other";
export type ReportStatus = "open" | "resolved_removed" | "resolved_kept";
export type NotificationType =
  | "interest_request_received"
  | "interest_request_accepted"
  | "interest_request_declined"
  | "interest_request_withdrawn"
  | "connection_confirmed"
  | "connection_requested"
  | "rating_received"
  | "listing_expiring"
  | "listing_expired"
  | "listing_filled"
  | "verification_approved"
  | "verification_rejected"
  | "verification_pending"
  | "new_message";
export type DocumentType = "property_document" | "rental_agreement" | "owner_id" | "trade_license";
export type AmenityCategory = "utility" | "safety" | "comfort";
export type PreferenceKey =
  | "smoking"
  | "food_habit"
  | "sleep_schedule"
  | "alcohol"
  | "cleanliness_level"
  | "noise_tolerance"
  | "guest_policy";
```

### `src/types/api.ts`
```ts
import type { ... } from "./enums";

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  email: string;
  roles: Role[];
  isEmailVerified: boolean;
}
export interface AuthResponse {
  user: AuthUser;
  sid: string;
}
export interface MeResponse extends AuthUser {
  sid: string;
}
export interface SessionItem {
  sid: string;
  isCurrent: boolean;
  expiresAt: string;
  issuedAt: string;
}

// ── Cursor ────────────────────────────────────────────────────────────────────
export interface Cursor {
  cursorTime: string;
  cursorId: string;
}
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | null;
}

// ── API envelope ──────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  status: "success";
  data: T;
}
export interface ApiMessage {
  status: "success";
  message: string;
}
export interface ApiError {
  status: "error";
  message: string;
  errors?: { field: string; message: string }[];
  code?: string;
  loginRedirect?: string;
}

// ── Profiles ──────────────────────────────────────────────────────────────────
export interface StudentProfile {
  profile_id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  profile_photo_url: string | null;
  bio: string | null;
  course: string | null;
  year_of_study: number | null;
  institution_id: string | null;
  is_aadhaar_verified: boolean;
  email: string | null;
  is_email_verified: boolean;
  average_rating: number;
  rating_count: number;
  created_at: string;
}
export interface PgOwnerProfile {
  profile_id: string;
  user_id: string;
  business_name: string;
  owner_full_name: string;
  business_description: string | null;
  business_phone: string | null;
  operating_since: number | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  email: string | null;
  is_email_verified: boolean;
  average_rating: number;
  rating_count: number;
  created_at: string;
}

// ── Preferences ───────────────────────────────────────────────────────────────
export interface PreferencePair {
  preferenceKey: PreferenceKey;
  preferenceValue: string;
}
export interface PreferenceMetaValue {
  value: string;
  label: string;
}
export interface PreferenceMetaItem {
  preferenceKey: PreferenceKey;
  label: string;
  values: PreferenceMetaValue[];
}

// ── Properties ────────────────────────────────────────────────────────────────
export interface Amenity {
  amenityId: string;
  name: string;
  category: AmenityCategory;
  iconName: string;
}
export interface Property {
  property_id: string;
  owner_id: string;
  property_name: string;
  description: string | null;
  property_type: PropertyType;
  address_line: string;
  city: string;
  locality: string | null;
  landmark: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  house_rules: string | null;
  total_rooms: number | null;
  status: PropertyStatus;
  average_rating: number;
  rating_count: number;
  amenities: Amenity[];
  created_at: string;
  updated_at: string;
}
export interface PropertyListItem extends Property {
  amenity_count: number;
  active_listing_count: number;
}

// ── Listings ──────────────────────────────────────────────────────────────────
export interface ListingPhoto {
  photoId: string;
  photoUrl: string;
  isCover: boolean;
  displayOrder: number;
  createdAt: string;
}
export interface ListingSearchItem {
  listingId: string;
  listingType: ListingType;
  title: string;
  city: string;
  locality: string | null;
  rentPerMonth: number;
  depositAmount: number;
  compatibilityScore: number;
  compatibilityAvailable: boolean;
  roomType: RoomType;
  preferredGender: Gender | null;
  availableFrom: string;
  status: ListingStatus;
}
export interface ListingDetail {
  listingId: string;
  postedBy: string;
  propertyId: string | null;
  listingType: ListingType;
  title: string;
  description: string | null;
  rentPerMonth: number;
  depositAmount: number;
  rentIncludesUtilities: boolean;
  isNegotiable: boolean;
  roomType: RoomType;
  bedType: BedType | null;
  totalCapacity: number;
  currentOccupants: number;
  preferredGender: Gender | null;
  availableFrom: string;
  availableUntil: string | null;
  addressLine: string | null;
  city: string;
  locality: string | null;
  landmark: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  viewsCount: number;
  expiresAt: string | null;
  poster_rating: number;
  poster_rating_count: number;
  poster_name: string;
  amenities: Amenity[];
  preferences: PreferencePair[];
  photos: ListingPhoto[];
  property: Property | null;
}
// Saved listings uses legacy snake_case from the backend
export interface SavedListingItem {
  listing_id: string;
  listing_type: ListingType;
  title: string;
  city: string;
  locality: string | null;
  room_type: RoomType;
  preferred_gender: Gender | null;
  available_from: string;
  status: ListingStatus;
  saved_at: string;
  property_name: string | null;
  average_rating: number;
  cover_photo_url: string | null;
  rentPerMonth: number;
  depositAmount: number;
}

// ── Interest Requests ─────────────────────────────────────────────────────────
export interface InterestRequest {
  interestRequestId: string;
  studentId: string;
  listingId: string;
  message: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}
export interface InterestRequestWithStudent extends InterestRequest {
  student: {
    userId: string;
    fullName: string;
    profilePhotoUrl: string | null;
    averageRating: number;
  };
}
export interface InterestRequestWithListing extends InterestRequest {
  listing: {
    listingId: string;
    title: string;
    city: string;
    listingType: ListingType;
    rentPerMonth: number;
  };
}
export interface AcceptedInterestResponse {
  interestRequestId: string;
  studentId: string;
  listingId: string;
  status: "accepted";
  connectionId: string;
  whatsappLink: string | null;
  listingFilled: boolean;
}

// ── Connections ───────────────────────────────────────────────────────────────
export interface ConnectionListItem {
  connectionId: string;
  connectionType: ConnectionType;
  confirmationStatus: ConfirmationStatus;
  initiatorConfirmed: boolean;
  counterpartConfirmed: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    listingId: string;
    title: string;
    city: string;
    rentPerMonth: number;
    listingType: ListingType;
  };
  otherParty: {
    userId: string;
    fullName: string;
    profilePhotoUrl: string | null;
    averageRating: number;
  };
}
export interface ConnectionDetail extends ConnectionListItem {
  interestRequestId: string | null;
  otherParty: ConnectionListItem["otherParty"] & { ratingCount: number };
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface Notification {
  notificationId: string;
  actorId: string | null;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export interface Rating {
  ratingId: string;
  reviewerId: string;
  revieweeType: RevieweeType;
  revieweeId: string;
  overallScore: number;
  cleanlinessScore: number | null;
  communicationScore: number | null;
  reliabilityScore: number | null;
  valueScore: number | null;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
}
export interface PublicRating {
  ratingId: string;
  overallScore: number;
  cleanlinessScore: number | null;
  communicationScore: number | null;
  reliabilityScore: number | null;
  valueScore: number | null;
  comment: string | null;
  createdAt: string;
  reviewer: { fullName: string; profilePhotoUrl: string | null };
}
export interface ConnectionRatings {
  myRatings: Rating[];
  theirRatings: Rating[];
}

// ── Contact Reveal ────────────────────────────────────────────────────────────
export interface StudentContactReveal {
  user_id: string;
  full_name: string;
  email: string;
  whatsapp_phone?: string;
}
export interface PgOwnerContactReveal {
  user_id: string;
  owner_full_name: string;
  business_name: string;
  email: string;
  whatsapp_phone?: string;
}
```

---

## API Client Layer

### `src/lib/api.ts`

A typed fetch wrapper. All calls go through this.

```ts
const BASE = "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: import("../types/api").ApiError
  ) {
    super(body.message);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // always send cookies
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}
```

On any `401` thrown from `apiFetch`, a top-level error boundary or router `onError` should redirect to `/login`.

Create `src/lib/api/` with one file per feature domain: `auth.ts`, `listings.ts`, `properties.ts`, `interests.ts`, `connections.ts`, `notifications.ts`, `ratings.ts`, `profiles.ts`. Each exports typed async functions (e.g. `searchListings(params)`, `createListing(body)`, etc.) that call `apiFetch`.

---

## Auth State

### `src/context/AuthContext.tsx`

Global auth context. On app mount, call `GET /auth/me` to hydrate. Exposes:
```ts
interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  role: "student" | "pg_owner" | null;
  isEmailVerified: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}
```

`role` is `user.roles[0]` cast to the known values. Components read `role` to branch rendering.

---

## Route Structure

All routes live under `src/routes/`. TanStack Router file-based routing.

```
src/routes/
  __root.tsx                  ← root layout: header, footer, auth hydration
  index.tsx                   ← public landing page (/)
  login.tsx                   ← /login
  register.tsx                ← /register
  
  _auth.tsx                   ← layout route: requires authenticated user
  _auth/
    dashboard.tsx             ← /dashboard  (role-branched)
    profile.tsx               ← /profile    (role-branched)
    preferences.tsx           ← /preferences (student only)
    notifications.tsx         ← /notifications
    connections.tsx           ← /connections
    connections.$connectionId.tsx   ← /connections/:connectionId
    interests.tsx             ← /interests  (student: sent; pg_owner: redirects)
    
  _pgowner.tsx                ← layout route: requires pg_owner role
  _pgowner/
    properties.tsx            ← /properties
    properties.new.tsx        ← /properties/new
    properties.$propertyId.tsx        ← /properties/:propertyId
    properties.$propertyId.edit.tsx   ← /properties/:propertyId/edit
    listings.new.tsx          ← /listings/new  (must pick a property first)
    listings.$listingId.edit.tsx      ← /listings/:listingId/edit
    listings.$listingId.interests.tsx ← /listings/:listingId/interests

  _student.tsx                ← layout route: requires student role
  _student/
    saved.tsx                 ← /saved

  listings.tsx                ← /listings  (public browse, optional auth)
  listings.$listingId.tsx     ← /listings/:listingId  (public detail, optional auth)
```

### Route Guards

- `_auth.tsx` — redirects to `/login` if no `user` in context.
- `_pgowner.tsx` — redirects to `/dashboard` if `role !== "pg_owner"`.
- `_student.tsx` — redirects to `/dashboard` if `role !== "student"`.
- `/login` and `/register` — redirect to `/dashboard` if already logged in.

---

## Pages — Detailed Specification

### Public Pages

#### `/` — Landing Page
- Hero section: headline, subheadline, two CTAs: "Find a Room" → `/listings` and "List Your PG" → `/register`.
- Brief feature overview: verified listings, trust pipeline, WhatsApp connect.
- No auth required.

#### `/login`
- Email + password form.
- Zod schema mirrors `loginSchema` from backend: email valid, password non-empty.
- On success: redirect to `/dashboard`.
- Link to `/register`.
- "Sign in with Google" button → shows a shadcn `Toast` saying "Google Sign-In coming soon."
- If `401` → show inline error "Invalid credentials."
- If account inactive (suspended/banned) → show inline error from API message.

#### `/register`
- Role toggle at the top: **Student** / **PG Owner** — visually distinct (tabs or segmented control).
- **Student fields:** Full Name, Email, Password (min 8, letter+number).
- **PG Owner fields:** Full Name, Business Name, Email, Password.
- Password has a show/hide toggle.
- Zod mirrors `registerSchema`.
- On success → redirect to `/dashboard`. If email not institution-verified, show a dismissible banner: "Verify your email to unlock full access" with a "Send OTP" button.
- "Sign in with Google" button → WIP toast.
- `409` → "An account with this email already exists."

---

### Authenticated Layout (`_auth`)

#### Shared Navigation

**Student nav:** Home, Browse Listings, My Interests, My Connections, Saved, Notifications (with unread badge), Profile.

**PG Owner nav:** Home, My Properties, My Connections, Notifications (with unread badge), Profile.

The unread badge on Notifications calls `GET /notifications/unread-count` on mount and polls every 60s.

---

#### `/dashboard` — Role-Branched Home

**Student dashboard:**
- Welcome banner with name.
- Quick stats row: active interest requests (pending count), confirmed connections, saved listings count.
- "Browse Listings" CTA.
- Recent notifications strip (last 3, link to `/notifications`).
- If `isEmailVerified === false`: prominent banner "Your email is not verified. Verify now →" with inline OTP flow (see OTP Modal below).

**PG Owner dashboard:**
- Welcome banner with name + verification badge (Verified / Pending / Unverified).
- If `verification_status === "unverified"` or `"rejected"`: banner "Your account is not verified. Upload documents to get listed." with link to profile page's documents section.
- If `verification_status === "pending"`: info banner "Verification under review."
- Quick stats: total active listings, total pending interest requests across all listings, confirmed connections.
- "Add New Property" and "Add New Listing" CTAs.
- Recent interest requests strip (last 3 pending across all listings).

---

#### `/profile` — Role-Branched

**Student profile page:**
- Avatar placeholder (initials-based since no upload UI yet).
- Editable fields: Full Name, Bio, Course, Year of Study, Gender, Date of Birth.
- Form uses `updateStudentSchema` on client.
- Below form: Email address (read-only, with verification status badge).
- OTP Verification section: if not verified, show "Send OTP" button. Clicking opens inline OTP entry (6-digit input). Submit calls `POST /auth/otp/verify`. Show remaining attempts on wrong OTP. Success → refresh user state.
- Rating summary: average stars + count (read-only display).
- Preferences section → link to `/preferences`.
- Account section: "Active Sessions" list (calls `GET /auth/sessions`), each with a "Revoke" button. "Log Out All" button.

**PG Owner profile page:**
- Editable fields: Business Name, Owner Full Name, Business Description, Business Phone, Operating Since.
- Form uses `updatePgOwnerSchema` on client.
- Verification status section:
  - `unverified` or `rejected`: Show current status, rejection reason if present, and a "Submit Verification Document" form (document type select + document URL text input — mirrors `submitDocumentSchema`). On `409` show "You already have a pending request."
  - `pending`: Show "Verification request under review."
  - `verified`: Show green badge + verified date.
- Rating summary display.
- Sessions + logout same as student.

---

#### `/preferences` — Student Only

- Calls `GET /preferences/meta` for the catalog.
- Calls `GET /students/:userId/preferences` for current values.
- Renders each preference key as a labeled radio group or select.
- "Save Preferences" submits `PUT /students/:userId/preferences`.
- Empty state: "Set your preferences to get compatibility scores on listings."
- Uses `updateStudentPreferencesSchema` Zod on client.

---

#### `/notifications`

- Calls `GET /notifications` (all, then filterable by read/unread).
- Filter tabs: All | Unread | Read.
- Each notification shows: icon by type, message text, relative timestamp ("2 hours ago"), unread dot.
- "Mark All Read" button → `POST /notifications/mark-read` with `{ all: true }`.
- Click on notification → navigate to relevant entity if applicable (e.g. interest request → `/connections/:id`, listing → `/listings/:id`).
- "Load More" button for pagination.
- Empty state per filter.

---

#### `/connections`

- Calls `GET /connections/me`.
- Filter tabs: All | Pending | Confirmed.
- Each connection card shows:
  - Other party name + avatar placeholder.
  - Listing title + city.
  - Connection type badge.
  - Confirmation status.
  - "View Details" link.
- Clicking a card → `/connections/:connectionId`.
- Empty state.

#### `/connections/:connectionId`

- Shows full connection detail.
- Other party info, listing summary, connection type, dates.
- **Confirmation section:** If `confirmationStatus === "pending"` and the current user hasn't confirmed yet (derive from `initiatorConfirmed`/`counterpartConfirmed` + who the current user is), show "Confirm Real-World Interaction" button → `POST /connections/:connectionId/confirm`.
- **WhatsApp section:** If connection came from interest acceptance and the other party is a PG owner, surface a "Chat on WhatsApp" button (link to `wa.me` deep-link — you'll need to either store this or re-derive it; for the prototype, link to the contact reveal instead).
- **Rating section:** If `confirmationStatus === "confirmed"`:
  - Shows existing ratings (calls `GET /ratings/connection/:connectionId`).
  - "Submit Rating" button if current user hasn't rated yet (check `myRatings` array).
    - Opens a modal/drawer with: `revieweeType` (user vs property — show both options if applicable), `overallScore` (1–5 star picker), optional dimension scores, optional comment.
    - Zod mirrors `submitRatingSchema`.
    - On success: refresh ratings.

---

#### `/interests` — Student Only

- Calls `GET /interests/me`.
- Filter tabs: All | Pending | Accepted | Declined | Withdrawn.
- Each item shows: listing title, city, rent, status badge, message preview, sent date.
- Status-specific actions:
  - `pending`: "Withdraw" button → `PATCH /interests/:id/status` `{ status: "withdrawn" }`.
  - `accepted`: "View Connection →" button → `/connections/:connectionId`.
- Click card → `/listings/:listingId` for context.
- Empty state per filter.

---

### PG Owner Routes (`_pgowner`)

#### `/properties`

- Calls `GET /properties`.
- Grid of property cards: name, type, city, rating, amenity count, active listing count.
- "Add Property" button → `/properties/new`.
- Each card: "View", "Edit", "Delete" actions.
  - Delete → confirmation dialog → `DELETE /properties/:propertyId`. Shows `409` error if active listings exist.
- Empty state: "You haven't added any properties yet."

#### `/properties/new`

- Form mirrors `createPropertySchema` (Zod on client).
- Fields: Property Name, Description, Property Type (select), Address Line, City, Locality, Landmark, Pincode, Latitude, Longitude, House Rules, Total Rooms.
- Amenities multi-select: calls `GET /amenities` (if endpoint exists) or hardcode the 19 known amenities from the seed.
- On success → redirect to `/properties`.
- `403` "must be verified" → redirect to profile with banner.

#### `/properties/:propertyId`

- Property detail view.
- Shows all fields, amenities, rating, active listings count.
- "Edit Property" button → `/properties/:propertyId/edit`.
- "Add Listing" button → `/listings/new?propertyId=:propertyId`.
- Listings section: table/list of listings for this property (call `GET /listings?postedBy=me` or filter from listing list), each with status badge, rent, "Edit" and "Manage Interests" links.

#### `/properties/:propertyId/edit`

- Pre-populated form, same fields as create.
- On save → `PUT /properties/:propertyId`.

#### `/listings/new`

- Pre-selects property from `?propertyId` query param (required for pg_room/hostel_bed).
- Fields: Listing Type (pg_room or hostel_bed for PG owners), Title, Description, Rent, Deposit, Utilities included toggle, Negotiable toggle, Room Type, Bed Type, Total Capacity, Preferred Gender, Available From, Available Until, Amenities (multi-select), Preferences.
- Zod mirrors `createListingSchema` client-side.
- On success → redirect to the listing detail.

#### `/listings/:listingId/edit`

- Pre-populated form.
- Status section: shows current status. If `active` → can set to `filled` or `deactivated`. If `deactivated` → can set to `active`. Uses `PATCH /listings/:listingId/status`.
- Photos section: list existing photos (`GET /listings/:listingId/photos`). Upload new photo (multipart `POST /listings/:listingId/photos`). Shows "Processing..." state for `processing:` placeholder URLs. Delete button per photo. "Set as Cover" button. Drag-free reorder (up/down buttons for prototype).

#### `/listings/:listingId/interests`

- Calls `GET /listings/:listingId/interests`.
- Filter tabs: Pending | Accepted | Declined | Withdrawn | Expired.
- Each request: student name, rating, message preview, date.
- **Pending items have two action buttons:** "Accept" and "Decline".
  - Accept → `PATCH /interests/:id/status` `{ status: "accepted" }`.
    - On success: show WhatsApp link if present in response (`whatsappLink`). Show whether listing was filled (`listingFilled`).
  - Decline → `PATCH /interests/:id/status` `{ status: "declined" }`.
- Show accepted items with "View Connection →" link.

---

### Public/Optional-Auth Routes

#### `/listings` — Browse

- Calls `GET /listings` with query params.
- **Filter sidebar/panel:**
  - City (text input)
  - Listing Type (select: student_room | pg_room | hostel_bed)
  - Min/Max Rent (number inputs, validated `minRent <= maxRent`)
  - Room Type (select)
  - Preferred Gender (select)
  - Available From (date)
  - Amenity IDs (multi-checkbox — hardcode the known amenities)
  - Proximity: Lat/Lng/Radius (for prototype, just show fields — not map-picker)
- Listing cards: cover photo placeholder (filter out `processing:` URLs), title, city/locality, rent, room type, compatibility score badge (only if `compatibilityAvailable === true`), status badge, "View Details" link.
- Guest users see up to 20 results per page (backend silently caps).
- Authenticated users see up to 100.
- `compatibilityScore` / `compatibilityAvailable`: show a small "X% match" badge if `compatibilityAvailable === true`. Otherwise show nothing.
- "Load More" button using cursor pagination.
- Empty state.

#### `/listings/:listingId` — Detail

- Calls `GET /listings/:listingId`.
- Photos carousel (filter out `processing:` URLs, show placeholder if empty).
- Full detail: title, type badge, rent (bold, ₹ symbol), deposit, utilities/negotiable flags, room type, capacity, gender preference, available from, address/city/locality.
- Property section (if pg_room/hostel_bed): property name, type, house rules, rating.
- Amenities grid with icons.
- Poster section: name, rating, "View Profile" link.
- **CTAs by auth state and role:**
  - **Guest:** "Sign in to Express Interest" button → `/login`. Contact reveal section — see below.
  - **Student:** "Express Interest" button (if listing is active, not their own). Opens a modal with optional message textarea. Submits `POST /listings/:listingId/interests`. On `409` show "You already have a pending request." On `422` show reason. On success show confirmation with "View My Interests →" link.
  - **PG Owner viewing their own listing:** "Edit Listing" and "Manage Interests" buttons.
  - **PG Owner viewing someone else's listing:** read-only, no CTAs.

**Contact Reveal section** (within listing detail, visible to all):
- "Reveal Contact" button.
- **Guest/Unverified flow:**
  - On click → `GET /students/:userId/contact/reveal` or `POST /pg-owners/:userId/contact/reveal`.
  - Show email in a card.
  - Track quota client-side. On `429` with `code: "CONTACT_REVEAL_LIMIT_REACHED"` → show a modal: "You've used your 10 free reveals. Create a free account to get unlimited access." with "Sign Up" CTA → `/register` and "Log In" → `/login`.
- **Verified user:** Show email + WhatsApp phone (if present) in the card.

---

## OTP Modal / Inline OTP Component

Used in profile page and post-registration banner. Reusable component.

- "Send OTP" button → `POST /auth/otp/send`.
  - On `409` "Email already verified" → dismiss and refresh user state.
  - On `502` → toast error.
- After send: 6-box digit input (one digit per box, auto-advance).
- "Verify" button → `POST /auth/otp/verify`.
- On wrong OTP: show "X attempts remaining" from error message.
- On `429` "Too many attempts" → show message and "Request New OTP" button.
- On success: toast "Email verified!" and refresh auth state (`GET /auth/me`).

---

## Zod Client Schemas

Create `src/lib/schemas/` with Zod schemas for all forms. These must be derived from the backend validators (already provided). Key ones:

```ts
// src/lib/schemas/auth.ts
export const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("student"),
    email: z.string().email(),
    password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Must contain a letter and a number"),
    fullName: z.string().min(2).max(255),
  }),
  z.object({
    role: z.literal("pg_owner"),
    email: z.string().email(),
    password: z.string().min(8).regex(/(?=.*[a-zA-Z])(?=.*\d)/),
    fullName: z.string().min(2).max(255),
    businessName: z.string().min(2).max(255),
  }),
]);

export const otpVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Must be exactly 6 digits"),
});
```

Similarly create schemas for: `createListing`, `updateListing`, `createProperty`, `updateProperty`, `updateStudent`, `updatePgOwner`, `submitRating`, `submitReport`, `submitDocument`, `updatePreferences`.

---

## UI Components to Build

### Shared

- `StarRating` — display-only 1–5 stars with half-star support. Also interactive variant for rating forms.
- `StatusBadge` — maps status strings to colored badges (e.g. `active` → green, `expired` → gray, `pending` → yellow).
- `NotificationBell` — icon + unread count badge.
- `ListingCard` — used on browse and saved pages.
- `PropertyCard` — used on `/properties`.
- `InterestCard` — used on interest dashboards.
- `ConnectionCard` — used on connections list.
- `LoadMoreButton` — takes `nextCursor`, `isLoading`, `onLoadMore`.
- `EmptyState` — icon + message + optional CTA button.
- `ConfirmDialog` — wraps shadcn `AlertDialog` for destructive actions.
- `OtpInput` — 6-box digit input component.
- `ContactRevealCard` — shows revealed contact info with quota-limit modal logic.
- `VerificationStatusBanner` — PG owner banner for unverified/pending/rejected states.

---

## Error Handling Patterns

- **Form errors** — Zod parse errors shown inline beneath each field.
- **API validation errors** (`errors: [{field, message}]`) — map `field` path (e.g. `body.email`) to the corresponding form field.
- **Operational API errors** — toast notification (shadcn `Sonner` or `Toast`) with the `message` string.
- **401** — clear auth context, redirect to `/login`.
- **403** — show inline "You don't have permission for this action."
- **404** — show a simple "Not found" inline message, not a full page.
- **409 on contact reveal** — show the quota modal.
- **Network error** — toast "Network error, please try again."
- **Processing photos** — filter out any `photoUrl` starting with `processing:` from all photo lists. Show a "Processing..." placeholder in its place if it's the only photo.

---

## Important Business Logic the Frontend Must Respect

1. **Money:** always display in rupees with `₹` symbol. The API sends rupees already.
2. **Listing status guards:** on the listing detail, check `status` before showing the interest button. `expired`, `filled`, `deactivated` → show a disabled state with the reason instead.
3. **Self-interest guard:** if `listing.postedBy === user.userId`, never show the interest button.
4. **Photo placeholder filter:** never render a `photoUrl` that starts with `processing:`.
5. **Compatibility score:** only show the match badge if `compatibilityAvailable === true`. If `compatibilityAvailable === false`, show nothing (not "0% match").
6. **WhatsApp link:** on accepted interest response, if `whatsappLink` is non-null, show it. If null, show "No WhatsApp number on file" — this is not an error.
7. **Contact reveal is POST for PG owners, GET for students** — the API client must use the correct method.
8. **Cursor pagination:** always send both `cursorTime` and `cursorId` together, or neither. Never send just one.
9. **PG owner verified gate:** when a PG owner tries to create a property or listing and gets a `403` "must be verified" error, redirect to the profile page with a banner explaining they need to complete verification.
10. **Interest withdrawal:** only `pending` requests can be withdrawn by the student. `accepted` cannot be withdrawn — hide the button for those.
11. **Connection confirmation:** determine which side the current user is (initiator vs counterpart) and check the corresponding flag. Only show "Confirm" if the current user's flag is `false`.

---

## Page Title / Head Management

Use TanStack Router's `head()` to set `<title>` per route:
- `/` → "Roomies — Find Your PG or Roommate"
- `/listings` → "Browse Listings — Roomies"
- `/listings/:listingId` → dynamic: listing title + " — Roomies"
- `/dashboard` → "Dashboard — Roomies"
- etc.

---

## What to Skip (Prototype Scope)

- No map integration (just show lat/lng text fields).
- No file upload UI for profile photos (use initials avatar).
- No real-time WebSocket (polling only where needed — notifications every 60s).
- No Google OAuth (WIP toast).
- No admin pages.
- No drag-and-drop photo reorder (use up/down buttons).
- No push notifications.
- No chat/messaging UI.