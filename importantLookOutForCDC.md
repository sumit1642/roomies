Now I have the full picture. Let me give you a definitive answer.

## ✅ YES — Your direct SQL update WILL fully propagate to the frontend

Here's exactly why, traced through your code:

**The CDC chain that makes it work:**

1. You `UPDATE verification_requests SET status = 'verified'` via SQL
2. The DB trigger `trg_verification_status_changed` (migration `002`) fires automatically — **it doesn't care if the change came from your API or raw SQL**
3. It inserts a row into `verification_event_outbox` with `event_type = 'verification_approved'`
4. `verificationEventWorker.js` polls the outbox every **5 seconds**, picks it up
5. The worker calls `processEvent()` which:
   - Corrects `pg_owner_profiles.verification_status` to `'verified'` (the consistency guard)
   - Enqueues an in-app notification
   - Enqueues a `verification_approved` email

The frontend reads `pg_owner_profiles.verification_status` via `GET /api/v1/pg-owners/:userId/profile` — which hits `getPgOwnerProfile()` in `pgOwner.service.js` — so the status will show as `verified` on next fetch.

---

## ⚠️ One important nuance

You need to update **both tables** — the trigger watches `verification_requests`, not `pg_owner_profiles`. So run this:

```sql
-- Step 1: Update verification_requests (this fires the trigger)
UPDATE verification_requests
SET 
  status = 'verified',
  reviewed_at = NOW()
WHERE request_id = '089e7f3c-ea89-4cba-8495-349cf16b9efb';
```

The trigger will fire and the `verificationEventWorker` will handle updating `pg_owner_profiles` automatically (that's exactly what the consistency guard in `processEvent()` does).

But if you want to be safe and not wait 5 seconds:

```sql
-- Step 2 (optional, worker will do this anyway): Update pg_owner_profiles directly
UPDATE pg_owner_profiles
SET 
  verification_status = 'verified',
  verified_at = NOW()
WHERE user_id = '09ec58d8-058e-450e-b9e8-c2ced443a2c0';
```

```sql
-- Step 3: Confirm both look correct
SELECT vr.status AS request_status, pop.verification_status AS profile_status
FROM verification_requests vr
JOIN pg_owner_profiles pop ON pop.user_id = vr.user_id
WHERE vr.request_id = '089e7f3c-ea89-4cba-8495-349cf16b9efb';
```

After running Step 1, check `verification_event_outbox` after a moment:

```sql
SELECT * FROM verification_event_outbox ORDER BY created_at DESC LIMIT 5;
```

You should see a new row with `event_type = 'verification_approved'` and `processed_at` filling in within 5 seconds.