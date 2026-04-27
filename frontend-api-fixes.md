# Frontend ↔ Backend API Fix Documentation

> **How to read this doc**
> - ✅ = currently wired correctly in frontend, skip
> - ❌ = broken or missing in frontend — needs fix/implementation
> - Each section shows: what the endpoint does, exact request shape, and all possible response shapes (JSON)
> - Base URL: `VITE_API_BASE_URL/api/v1`

---

## 1. Auth — `src/lib/api/auth.ts`

### ❌ `POST /auth/logout` — Body required, frontend sends it optionally

**Problem:** Frontend calls `logout()` and conditionally sends `refreshToken` body only in prod. But the backend endpoint `/auth/logout` (no auth middleware) **requires** a `refreshToken` in body. The authed variant `/auth/logout/current` also requires it. Frontend must always send it.

**Request:**
```json
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

**Success:**
```json
{ "status": "success", "message": "Logged out" }
```

**Failure — missing token:**
```json
HTTP 401
{ "status": "error", "message": "Refresh token is required" }
```

**Fix:** In `logout()` in `auth.ts`, always pass `refreshToken` from `tokenStore.getRefreshToken()` in body, even in dev (dev uses cookies but backend also checks `req.body.refreshToken` first, so it's safe).

---

### ❌ `GET /auth/sessions` — Response shape mismatch

**Problem:** Frontend `getSessions()` expects `ApiSuccess<SessionItem[]>`. Backend returns exactly that. **BUT** the `SessionItem` type in `src/types/api.ts` has `issuedAt` — backend returns `issuedAt` (can be `null` if decode fails). Frontend type is correct; issue is that frontend never surfaces session `issuedAt`. Not a blocker but worth noting.

**Response:**
```json
HTTP 200
{
  "status": "success",
  "data": [
    {
      "sid": "uuid",
      "isCurrent": true,
      "expiresAt": "2025-07-01T10:00:00.000Z",
      "issuedAt": "2025-06-24T10:00:00.000Z"
    },
    {
      "sid": "uuid",
      "isCurrent": false,
      "expiresAt": "2025-07-01T08:00:00.000Z",
      "issuedAt": null
    }
  ]
}
```

---

## 2. Listings — `src/lib/api/listings.ts`

### ❌ `GET /listings` — Missing `sortBy` and `bedType` params

**Problem:** `searchListings()` in frontend does not pass `sortBy` or `bedType` params. Backend supports both. `sortBy=compatibility` returns listings sorted by preference match (no cursor pagination in that mode — `nextCursor` is always `null`).

**Request params (all optional):**
```
GET /listings?city=Pune&minRent=5000&maxRent=15000&roomType=single
  &bedType=single_bed&preferredGender=female&listingType=pg_room
  &availableFrom=2025-07-01&amenityIds=uuid1,uuid2
  &sortBy=recent|compatibility
  &lat=18.5204&lng=73.8567&radius=5000
  &cursorTime=2025-06-01T00:00:00Z&cursorId=uuid&limit=20
```

**Success — `sortBy=recent` (default):**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "items": [
      {
        "listing_id": "uuid",
        "posted_by": "uuid",
        "property_id": "uuid | null",
        "listing_type": "pg_room",
        "title": "Spacious Single Room with AC",
        "city": "Pune",
        "locality": "Kothrud",
        "rent_per_month": null,
        "deposit_amount": null,
        "rentPerMonth": 8000,
        "depositAmount": 16000,
        "room_type": "single",
        "preferred_gender": "female",
        "available_from": "2025-07-01",
        "status": "active",
        "created_at": "2025-06-01T10:00:00.000Z",
        "property_name": "Sunshine PG",
        "average_rating": 4.2,
        "cover_photo_url": "https://...",
        "compatibilityScore": 3,
        "compatibilityAvailable": true,
        "rentDeviation": 12
      }
    ],
    "nextCursor": {
      "cursorTime": "2025-05-30T10:00:00.000Z",
      "cursorId": "uuid"
    }
  }
}
```

**Note:** `rentDeviation` is new — it's the % above/below local median rent (from rent_index). `null` if no index data. Frontend currently ignores this field entirely — could display a "X% above/below market" badge.

**Success — `sortBy=compatibility`:**
```json
{
  "data": {
    "items": [...sorted by compatibilityScore desc],
    "nextCursor": null
  }
}
```

---

### ❌ `GET /listings/:listingId` — Response has extra fields frontend ignores

**Problem:** `getListing()` returns additional fields that frontend `ListingDetail` type does NOT include. Frontend will silently drop them. Add to type if you want to use:

```json
{
  "status": "success",
  "data": {
    "listing_id": "uuid",
    ...all ListingDetail fields...,
    "rentDeviation": 12,
    "rentIndex": {
      "p25": 6000,
      "p50": 8500,
      "p75": 11000,
      "sampleCount": 48,
      "resolution": "locality"
    }
  }
}
```

`rentIndex` and `rentDeviation` are never shown in the listing detail page. Add them to show market context to the student.

**Failure:**
```json
HTTP 404
{ "status": "error", "message": "Listing not found" }
```

```json
HTTP 422
{ "status": "error", "message": "Listing has expired and is no longer available" }
```

---

### ❌ `GET /listings/me/saved` — Endpoint works but `city` param for `listingsApi.browseListings` filter is broken

Frontend `searchListings()` passes `roomType` as the key. Backend validator expects `roomType` (camelCase) ✅. But in `browse.tsx`, filters use `room_type` (snake_case) key in state. The translation happens in `fetchListings()` — check it passes `roomType: activeFilters.room_type`. Currently it does, so ✅. 

**Saved listings response:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "items": [
      {
        "listing_id": "uuid",
        "listing_type": "pg_room",
        "title": "...",
        "city": "Pune",
        "locality": "Kothrud",
        "rent_per_month": null,
        "deposit_amount": null,
        "rentPerMonth": 8000,
        "depositAmount": 16000,
        "room_type": "single",
        "preferred_gender": "female",
        "available_from": "2025-07-01",
        "status": "active",
        "saved_at": "2025-06-20T10:00:00.000Z",
        "property_name": "Sunshine PG",
        "average_rating": 4.2,
        "cover_photo_url": "https://..."
      }
    ],
    "nextCursor": { "cursorTime": "...", "cursorId": "uuid" }
  }
}
```

---

### ❌ `POST /listings/:listingId/photos` — Frontend upload broken for multipart

**Problem:** `uploadListingPhoto()` in frontend manually calls `fetch()` to handle multipart. This is correct. But the response shape is **not** `ListingPhoto` — the backend returns a **202 Accepted** with a provisional object, not the final photo. Frontend type assumes `ListingPhoto` is returned immediately.

**Actual response:**
```json
HTTP 202
{
  "status": "success",
  "data": {
    "photoId": "uuid",
    "status": "processing"
  }
}
```

The photo is processed async by the media worker. To get final URLs, call `GET /listings/:id/photos` after a delay.

**Error — too many photos (max 5):**
```json
HTTP 422
{
  "status": "error",
  "message": "Listing already has the maximum of 5 photos. Delete an existing photo before uploading a new one."
}
```

**Error — listing not found or not yours:**
```json
HTTP 404
{ "status": "error", "message": "Listing not found" }
```

**Error — file too large (>10MB):**
```json
HTTP 413
{ "status": "error", "message": "File is too large. Maximum allowed size is 10MB" }
```

**Error — wrong field name (must be `photo`):**
```json
HTTP 400
{ "status": "error", "message": "Unexpected file field. Use field name 'photo'" }
```

---

### ❌ `GET /listings/:listingId/analytics` — Not implemented in frontend at all

**This endpoint exists in backend but has zero frontend implementation.**

```
GET /listings/:listingId/analytics
Authorization: Bearer token (must be listing owner)
```

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "listingId": "uuid",
    "title": "Spacious Single Room",
    "status": "active",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "expiresAt": "2025-08-01T10:00:00.000Z",
    "views": 142,
    "interests": {
      "total": 18,
      "pending": 5,
      "accepted": 2,
      "declined": 8,
      "withdrawn": 2,
      "expired": 1
    },
    "conversionRate": 12.68
  }
}
```

`conversionRate` = `(total interests / views) * 100`, `null` if no views yet.

**Failure — not owner:**
```json
HTTP 403
{ "status": "error", "message": "Forbidden" }
```

---

### ❌ `POST /listings/:listingId/renew` — Not implemented in frontend at all

Renews a listing (sets status back to `active`, extends `expires_at` by 60 days). Works on `active`, `expired`, or `deactivated` listings.

```
POST /listings/:listingId/renew
Authorization: Bearer token
```

No request body needed.

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "listingId": "uuid",
    "status": "active",
    "expiresAt": "2025-08-28T10:00:00.000Z",
    "renewedFor": "60 days"
  }
}
```

**Failure — filled listing (cannot renew):**
```json
HTTP 422
{
  "status": "error",
  "message": "Listing cannot be renewed from its current status 'filled'. Only active, expired, or deactivated listings can be renewed."
}
```

---

## 3. Interests — `src/lib/api/interests.ts`

### ❌ `GET /interests/me` — `status` filter value `"accepted"` missing from frontend tabs

**Problem:** Frontend `interests.tsx` has tabs for `pending | accepted | declined | withdrawn | expired`. But when passing `status` filter, the value `"accepted"` does work on backend. ✅ This is fine. However the accepted tab shows a "View Connection" button, but **the connection ID is not in the interest list response**. The frontend links to `/connections` generically — that's the only option since the list endpoint doesn't return `connectionId`.

If you want to link directly to the connection, call `GET /interests/:interestId` (single interest) which does return context, but not `connectionId` either.

**List response (each item):**
```json
{
  "interestRequestId": "uuid",
  "listingId": "uuid",
  "status": "pending",
  "message": "Hi, I'm a 2nd year student...",
  "createdAt": "2025-06-20T10:00:00.000Z",
  "updatedAt": "2025-06-20T10:00:00.000Z",
  "listing": {
    "listingId": "uuid",
    "title": "Spacious Single Room",
    "city": "Pune",
    "listingType": "pg_room",
    "rentPerMonth": 8000
  }
}
```

---

### ❌ `GET /listings/:listingId/interests` — `status` filter does not support `"accepted"` string

**Problem:** In `listings.tsx` (`InterestsPanelDialog`), the frontend passes `activeTab as "pending" | "accepted"` to `getListingInterests()`. Backend validator for `getListingInterestsSchema` only allows: `pending | accepted | declined | withdrawn | expired`. Value `"accepted"` ✅ is valid. Fine.

**Response per item (owner view, includes student info):**
```json
{
  "interestRequestId": "uuid",
  "studentId": "uuid",
  "listingId": "uuid",
  "status": "pending",
  "message": "Hi, I'd like to rent...",
  "createdAt": "2025-06-20T10:00:00.000Z",
  "updatedAt": "2025-06-20T10:00:00.000Z",
  "student": {
    "userId": "uuid",
    "fullName": "Ravi Kumar",
    "profilePhotoUrl": "https://... | null",
    "averageRating": 4.1
  }
}
```

---

### ❌ `PATCH /interests/:interestId/status` — Accept response shape has extra fields frontend ignores

**Problem:** When `status = "accepted"`, backend returns `AcceptedInterestResponse`, not plain `InterestRequest`. Frontend `handleAccept` in `InterestsPanelDialog` does nothing with the returned `whatsappLink` — this is the owner's WhatsApp link to reach the student. Should show it.

**Accept success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "interestRequestId": "uuid",
    "studentId": "uuid",
    "listingId": "uuid",
    "status": "accepted",
    "connectionId": "uuid",
    "whatsappLink": "https://wa.me/919876543210?text=Hi%20Ravi...",
    "listingFilled": false
  }
}
```

`whatsappLink` is `null` if the student hasn't added a phone number. `listingFilled: true` means the listing was auto-marked as filled (capacity exhausted).

**Decline/Withdraw success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "interestRequestId": "uuid",
    "studentId": "uuid",
    "listingId": "uuid",
    "status": "declined",
    "updatedAt": "2025-06-20T10:00:00.000Z"
  }
}
```

**Failure — already not pending:**
```json
HTTP 409
{
  "status": "error",
  "message": "Interest request cannot be declined — current status is 'accepted'"
}
```

**Failure — listing expired when accepting:**
```json
HTTP 422
{ "status": "error", "message": "Listing has expired and is no longer available" }
```

---

## 4. Connections — `src/lib/api/connections.ts`

### ❌ `GET /connections/me` — `confirmationStatus` filter not exposed in frontend UI

**Problem:** `getMyConnections()` sends `confirmationStatus` correctly to backend. But the filter only accepts these values on backend:

```
confirmed | pending | denied | expired
```

Frontend `TabFilter` type uses `"all" | "pending" | "confirmed"` which maps correctly ✅.

**Response per item:**
```json
{
  "connectionId": "uuid",
  "connectionType": "pg_stay",
  "confirmationStatus": "pending",
  "initiatorConfirmed": true,
  "counterpartConfirmed": false,
  "startDate": null,
  "endDate": null,
  "createdAt": "2025-06-20T10:00:00.000Z",
  "updatedAt": "2025-06-20T10:00:00.000Z",
  "listing": {
    "listingId": "uuid",
    "title": "Spacious Single Room",
    "city": "Pune",
    "rentPerMonth": 8000,
    "listingType": "pg_room"
  },
  "otherParty": {
    "userId": "uuid",
    "fullName": "Ravi Kumar",
    "profilePhotoUrl": "https://... | null",
    "averageRating": 4.1
  }
}
```

---

### ❌ `GET /connections/:connectionId` — `ratingCount` is nested inside `otherParty` but frontend TypeScript cast is fragile

**Problem:** In `ConnectionDetailView`, frontend accesses `ratingCount` via:
```ts
(detail.otherParty as { ratingCount?: number }).ratingCount ?? 0
```

But `ConnectionDetail` extends `ConnectionListItem` and overrides `otherParty` with `ratingCount` included. The backend returns:

```json
{
  "otherParty": {
    "userId": "uuid",
    "fullName": "Ravi Kumar",
    "profilePhotoUrl": null,
    "averageRating": 4.1,
    "ratingCount": 12
  }
}
```

**Fix:** Update `ConnectionDetail` type so `otherParty` includes `ratingCount: number` properly instead of the unsafe cast.

---

## 5. Notifications — `src/lib/api/notifications.ts`

### ✅ All notification endpoints are correctly wired.

**`GET /notifications`** — `isRead` filter (boolean, optional), cursor pagination. ✅  
**`GET /notifications/unread-count`** — Returns `{ count: number }` (not `unreadCount`). Frontend correctly uses `res.data.count`. ✅  
**`POST /notifications/mark-read`** — Two modes:

```json
{ "notificationIds": ["uuid1", "uuid2"] }
```
or
```json
{ "all": true }
```

Cannot send both simultaneously. ✅

---

## 6. Profiles

### ❌ `PUT /students/:userId/photo` — Not implemented in frontend

Frontend shows "Photo upload coming soon" toast. The endpoint exists and works.

```
PUT /students/:userId/photo
Authorization: Bearer token (must be own userId)
Content-Type: multipart/form-data
Field name: "photo"
Accepted: image/jpeg, image/png, image/webp (max 10MB)
```

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "profilePhotoUrl": "https://storage.../profiles/uuid/uuid.webp"
  }
}
```

**Failure — wrong field name:**
```json
HTTP 400
{ "status": "error", "message": "No file uploaded — send the image under the field name 'photo'" }
```

**Failure — file too large:**
```json
HTTP 413
{ "status": "error", "message": "File is too large. Maximum allowed size is 10MB" }
```

**Failure — not own profile:**
```json
HTTP 403
{ "status": "error", "message": "Forbidden" }
```

---

### ❌ `DELETE /students/:userId/photo` — Not implemented in frontend

```
DELETE /students/:userId/photo
Authorization: Bearer token
```

No body needed.

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": { "profilePhotoUrl": null }
}
```

---

### ❌ `PUT /pg-owners/:userId/photo` — Not implemented in frontend

Same as student photo upload but for PG owners:

```
PUT /pg-owners/:userId/photo
Authorization: Bearer token
Content-Type: multipart/form-data
Field name: "photo"
```

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": { "profilePhotoUrl": "https://..." }
}
```

---

### ❌ `GET /students/:userId/contact/reveal` — Response shape has `whatsapp_phone` but frontend only shows email sometimes

**Problem:** Frontend in `connections.tsx` and `listings.tsx` calls `revealStudentContact()` but only surfaces `whatsapp_phone` if it exists. **The field name is `whatsapp_phone` (snake_case), NOT `whatsappPhone`**. Frontend type `StudentContactReveal` correctly has `whatsapp_phone?: string`. ✅

**Guest / unverified response (emailOnly mode):**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "full_name": "Ravi Kumar",
    "email": "ravi@example.com"
  }
}
```

**Verified user response (full contact):**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "full_name": "Ravi Kumar",
    "email": "ravi@example.com",
    "whatsapp_phone": "919876543210"
  }
}
```

**Guest rate-limited (after 10 reveals):**
```json
HTTP 429
{
  "status": "error",
  "message": "Free contact reveal limit reached. Please log in or sign up to continue.",
  "code": "CONTACT_REVEAL_LIMIT_REACHED",
  "loginRedirect": "/login/signup"
}
```

---

### ❌ `POST /pg-owners/:userId/contact/reveal` — Not implemented in frontend

Note: PG owner contact reveal is a **POST** (not GET) and consumes a quota slot. Frontend never calls this — no "contact owner" button exists for students viewing a PG owner's profile directly outside of a connection.

```
POST /pg-owners/:userId/contact/reveal
Authorization: Bearer token (optional — guests get partial data)
```

**Success (verified user):**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "owner_full_name": "Suresh Mehta",
    "business_name": "Sunshine PG",
    "email": "suresh@example.com",
    "whatsapp_phone": "919876543210"
  }
}
```

---

## 7. Ratings — `src/lib/api/ratings.ts`

### ❌ `GET /ratings/user/:userId` and `GET /ratings/property/:propertyId` — Missing from frontend public profile views

Frontend `getPublicUserRatings()` and `getPublicPropertyRatings()` exist in the API client but are only used in the listing detail page for property ratings. There is no public student rating display page.

**Public rating response (each item):**
```json
{
  "ratingId": "uuid",
  "overallScore": 4,
  "cleanlinessScore": 5,
  "communicationScore": 4,
  "reliabilityScore": 3,
  "valueScore": null,
  "comment": "Great roommate!",
  "createdAt": "2025-06-01T10:00:00.000Z",
  "reviewer": {
    "fullName": "Priya Singh",
    "profilePhotoUrl": "https://... | null"
  }
}
```

---

### ❌ `POST /:ratingId/report` — Not implemented in frontend at all

Backend has a full report system for flagging bad ratings. Frontend has zero UI for this.

```
POST /ratings/:ratingId/report
Authorization: Bearer token
```

**Request body:**
```json
{
  "reason": "fake | abusive | conflict_of_interest | other",
  "explanation": "This review is from a competitor"
}
```

**Success:**
```json
HTTP 201
{
  "status": "success",
  "data": {
    "reportId": "uuid",
    "reporterId": "uuid",
    "ratingId": "uuid",
    "reason": "fake",
    "status": "open",
    "createdAt": "2025-06-20T10:00:00.000Z"
  }
}
```

**Failure — not a party to the connection:**
```json
HTTP 404
{ "status": "error", "message": "Rating not found or you are not a party to this connection" }
```

---

## 8. Rent Index — Not implemented in frontend at all

### ❌ `GET /rent-index` — Entirely missing from frontend

Backend exposes local rent percentile data (p25/p50/p75). This is surfaced in `getListing()` response as `rentIndex` and `rentDeviation` but there's no standalone use.

```
GET /rent-index?city=Pune&locality=Kothrud&roomType=single
```

All three params are **required**.

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "city": "pune",
    "locality": "kothrud",
    "roomType": "single",
    "resolution": "locality",
    "p25": 6000,
    "p50": 8500,
    "p75": 11000,
    "sampleCount": 48,
    "computedAt": "2025-06-20T03:00:00.000Z"
  }
}
```

`resolution` is `"locality"` (precise) or `"city"` (city-wide fallback when not enough local data).

**Failure — no data yet:**
```json
HTTP 404
{ "status": "error", "message": "No rent index data available for this city / room type combination yet" }
```

---

## 9. Saved Searches — Not implemented in frontend at all

### ❌ Full CRUD for saved searches — entirely missing from frontend

**`GET /saved-searches`**
```
GET /saved-searches
Authorization: Bearer token
```

**Response:**
```json
HTTP 200
{
  "status": "success",
  "data": [
    {
      "search_id": "uuid",
      "name": "Pune Single Rooms",
      "filters": {
        "city": "Pune",
        "roomType": "single",
        "minRent": 5000,
        "maxRent": 12000,
        "preferredGender": "female",
        "amenityIds": ["uuid1"]
      },
      "last_alerted_at": "2025-06-20T08:00:00.000Z | null",
      "created_at": "2025-06-01T10:00:00.000Z",
      "updated_at": "2025-06-01T10:00:00.000Z"
    }
  ]
}
```

**`POST /saved-searches`**
```json
{
  "name": "Pune Single Rooms",
  "filters": {
    "city": "Pune",
    "roomType": "single",
    "minRent": 5000,
    "maxRent": 12000,
    "preferredGender": "female",
    "listingType": "pg_room",
    "availableFrom": "2025-07-01",
    "amenityIds": ["uuid1", "uuid2"]
  }
}
```

**Filters — all optional:**
| Field | Type | Values |
|---|---|---|
| `city` | string | any |
| `minRent` | number | rupees |
| `maxRent` | number | rupees |
| `roomType` | string | `single\|double\|triple\|entire_flat` |
| `bedType` | string | `single_bed\|double_bed\|bunk_bed` |
| `preferredGender` | string | `male\|female\|other\|prefer_not_to_say` |
| `listingType` | string | `student_room\|pg_room\|hostel_bed` |
| `availableFrom` | string | `YYYY-MM-DD` |
| `amenityIds` | string[] | UUIDs |

**Constraint:** `minRent` cannot exceed `maxRent`. Max 10 saved searches per user.

**Success:**
```json
HTTP 201
{
  "status": "success",
  "data": { ...saved search object as above... }
}
```

**Failure — limit reached:**
```json
HTTP 422
{ "status": "error", "message": "You can save at most 10 searches" }
```

**`PATCH /saved-searches/:searchId`** — Update name or filters (partial update, same filters shape).

**`DELETE /saved-searches/:searchId`**

```json
HTTP 200
{ "status": "success", "data": { "searchId": "uuid", "deleted": true } }
```

---

## 10. Roommate Matching — Not implemented in frontend at all

### ❌ `GET /students/roommates` — Feed of students seeking roommates

```
GET /students/roommates?city=Pune&limit=20&cursorTime=...&cursorId=...
Authorization: Bearer token (student role only)
```

**Response per item:**
```json
{
  "userId": "uuid",
  "fullName": "Priya Singh",
  "profilePhotoUrl": "https://... | null",
  "bio": "2nd year B.Tech student...",
  "roommateBio": "Looking for a clean, quiet flatmate",
  "course": "B.Tech Computer Science",
  "yearOfStudy": 2,
  "averageRating": 4.2,
  "ratingCount": 3,
  "institution": {
    "name": "IIT Bombay",
    "city": "Mumbai"
  },
  "compatibilityScore": 75,
  "compatibilityAvailable": true,
  "preferences": [
    { "preferenceKey": "smoking", "preferenceValue": "non_smoker" },
    { "preferenceKey": "food_habit", "preferenceValue": "vegetarian" }
  ]
}
```

`compatibilityScore` is 0–100 (Jaccard similarity). `compatibilityAvailable: false` means either caller or candidate has no preferences set — hide the score badge.

---

### ❌ `PUT /students/:userId/roommate-profile` — Toggle opt-in for roommate matching

```
PUT /students/:userId/roommate-profile
Authorization: Bearer token (own userId only)
```

**Request:**
```json
{
  "lookingForRoommate": true,
  "roommateBio": "Looking for a clean flatmate in Pune near COEP"
}
```

`roommateBio` is optional.

**Success:**
```json
HTTP 200
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "lookingForRoommate": true,
    "roommateBio": "...",
    "lookingUpdatedAt": "2025-06-20T10:00:00.000Z"
  }
}
```

---

### ❌ `POST /students/:userId/block/:targetUserId` — Block user from roommate feed

```
POST /students/:userId/block/:targetUserId
Authorization: Bearer token (own userId only)
```

No body. Both `:userId` must match authenticated user.

**Success:**
```json
HTTP 200
{ "status": "success", "data": { "blockedUserId": "uuid", "blocked": true } }
```

**Failure — self-block:**
```json
HTTP 422
{ "status": "error", "message": "You cannot block yourself" }
```

**Failure — too many blocks (max 200):**
```json
HTTP 422
{ "status": "error", "message": "You can block at most 200 users" }
```

**`DELETE /students/:userId/block/:targetUserId`** — Unblock (idempotent):
```json
HTTP 200
{ "status": "success", "data": { "blockedUserId": "uuid", "blocked": false } }
```

---

## 11. Global Error Shapes

All errors follow this shape:

```json
{
  "status": "error",
  "message": "Human-readable message"
}
```

Validation errors (400) include field details:
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "body.rentPerMonth", "message": "Rent must be a whole number (rupees)" },
    { "field": "body.availableFrom", "message": "availableFrom must be a valid date (YYYY-MM-DD)" }
  ]
}
```

**Common HTTP codes:**
| Code | When |
|---|---|
| `400` | Validation failed |
| `401` | No token / expired token |
| `403` | Valid token but wrong role or not resource owner |
| `404` | Resource not found |
| `409` | Conflict (duplicate, status mismatch) |
| `413` | File too large |
| `422` | Business rule violation (expired listing, etc.) |
| `429` | Rate limited |
| `502` | Storage/email upstream failure |
| `503` | Queue unavailable |

---

## 12. Summary — Priority Order

| Priority | Feature | File to edit |
|---|---|---|
| 🔴 High | Profile photo upload (student + PG owner) | `profile.tsx`, new `api/profiles.ts` functions |
| 🔴 High | Photo upload returns 202, not final URL | `listings.ts` `uploadListingPhoto()` |
| 🔴 High | Accept interest → show `whatsappLink` to owner | `listings.tsx` `InterestsPanelDialog` |
| 🔴 High | Listing renew button in owner listings page | `listings.tsx`, new `renewListing()` in `listings.ts` |
| 🟡 Medium | Listing analytics view for owners | New page or modal in `listings.tsx` |
| 🟡 Medium | `rentIndex` + `rentDeviation` in listing detail | `listing.$id.tsx` |
| 🟡 Medium | Saved searches CRUD | New page, new `api/savedSearches.ts` |
| 🟡 Medium | Roommate feed + opt-in toggle | New page, new `api/roommates.ts` |
| 🟢 Low | Rating report button | Connection detail view |
| 🟢 Low | `ConnectionDetail.otherParty.ratingCount` type fix | `types/api.ts` |
