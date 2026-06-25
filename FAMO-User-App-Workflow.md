---
pdf_options:
  format: A4
  margin: 25mm
  displayHeaderFooter: true
  headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#999;">FAMO User App — System Workflow & Business Logic</div>'
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#999;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> &nbsp;|&nbsp; Confidential — FAMO / Fast Motion Logistics Ltd</div>'
stylesheet: https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css
body_class: markdown-body
---

# FAMO User App — System Workflow & Business Logic

**Document Version:** 1.0  
**Date:** June 17, 2026  
**Prepared for:** Client Review & Stakeholder Meeting  
**Platform:** Android (React Native / Expo)  
**Currency:** Nigerian Naira (₦)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Authentication](#2-user-authentication)
3. [Home Screen & Navigation](#3-home-screen--navigation)
4. [Delivery Booking Flow (Step-by-Step)](#4-delivery-booking-flow-step-by-step)
5. [Pricing Algorithm & Fare Calculation](#5-pricing-algorithm--fare-calculation)
6. [Payment Processing](#6-payment-processing)
7. [System Dispatch & Rider Assignment](#7-system-dispatch--rider-assignment)
8. [Live Tracking & Real-Time Updates](#8-live-tracking--real-time-updates)
9. [Cancellation Rules & Constraints](#9-cancellation-rules--constraints)
10. [Delivery Completion & Rating](#10-delivery-completion--rating)
11. [Scheduled (Future) Deliveries](#11-scheduled-future-deliveries)
12. [Order Management](#12-order-management)
13. [In-App Chat](#13-in-app-chat)
14. [Cold-Start Resume Logic](#14-cold-start-resume-logic)
15. [Delivery State Machine (All Statuses)](#15-delivery-state-machine-all-statuses)
16. [Database Schema Summary](#16-database-schema-summary)
17. [Edge Cases & Error Handling](#17-edge-cases--error-handling)

---

## 1. System Overview

FAMO is an on-demand package delivery platform built for the Nigerian market. The **User App** allows customers to request deliveries, track riders in real time, and manage their orders. It connects to:

- **Supabase** — PostgreSQL database, authentication, real-time subscriptions, file storage
- **Google Maps Platform** — Places Autocomplete, Geocoding, Directions API
- **Backend API** (`fam.ubiqco.com`) — proxy layer for geocoding and route calculations
- **Rider App** (separate application) — riders receive, accept, and fulfill delivery requests

**Architecture:** The User App and Rider App share a single Supabase backend. The User App uses Supabase Auth (email/password with OTP verification). All real-time communication (status changes, rider location, chat) flows through Supabase Realtime (Postgres Changes + Broadcast channels).

---

## 2. User Authentication

### 2.1 Sign-Up Flow
1. User enters **full name**, **email address**, and **password**
2. Account created via Supabase Auth
3. OTP verification email sent to the provided address
4. User enters the OTP code on the verification screen
5. On success → profile row created in `public.users` table → user lands on Home

### 2.2 Login Flow
1. User enters **email** and **password**
2. Supabase Auth validates credentials and returns a session token
3. Session is stored locally on the device (persists across app restarts)
4. User lands on Home (or is resumed to their last active delivery screen)

### 2.3 Session Management
- Sessions are cached locally by the Supabase SDK
- All authenticated API calls use the cached session (no network round-trip per action)
- Password reset is handled via the Forgot Password → email link flow

---

## 3. Home Screen & Navigation

### 3.1 Home Dashboard
When the user opens the app, the Home screen displays:

- **Greeting:** "Hello, {First Name}. Where shall we deliver today?"
- **Search bar** (tapping navigates to the booking flow)
- **Action Cards (2×2 grid):**

| Card | Description |
|------|-------------|
| **Schedule** | Start a new delivery booking |
| **Track Package** | Enter a tracking code (e.g., FAMO-549BF) to find an order |
| **Get Quote** | Estimate delivery cost without booking |
| **Support** | Access customer support |

- **Active Delivery Card:** If there is an ongoing delivery (status: `searching`, `accepted`, or `picked_up`), a card appears showing pickup → dropoff, rider info, and a "Track" button. Only the **most recent** active delivery is shown.
- **Promo Banner:** "FIRST DELIVERY — Professional pickup, simple pricing"

### 3.2 Bottom Navigation (4 Tabs)

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | `/` | Dashboard with quick actions |
| Orders | `/orders` | List of all orders (Active, Scheduled, Completed) |
| Menu | Sidebar | Profile, settings, help |
| Notifications | `/notifications` | Delivery updates and system alerts |

### 3.3 Data Refresh
- Home data refreshes **every time the screen comes into focus** (not just on first load)
- This ensures completed deliveries are removed from the active card immediately

---

## 4. Delivery Booking Flow (Step-by-Step)

The booking process consists of **6 sequential screens**. All data is stored in a temporary "draft" that lives in memory until the delivery is confirmed.

### Step 1: Select Package Category (`/schedule`)

The user selects what they are sending:

| Category | Label |
|----------|-------|
| `documents` | Documents |
| `electronics` | Electronics |
| `fragile` | Fragile Items |
| `food` | Food |
| `other` | Other (user enters a custom description) |

### Step 2: Pickup Address (`/pickup-address`)

**Progress indicator:** Step 1 of 2

The user provides:
1. **City / Address** — text input with Google Places Autocomplete suggestions
   - Suggestions appear as user types (debounced)
   - Tapping a suggestion geocodes it to exact coordinates
   - The preview map automatically pans to the selected location
   - User can also drag the map pin for fine-tuning
2. **Sender Name** — full name of the person at the pickup location
3. **Sender Phone** — contact number for pickup
4. **Pickup Notes** (optional) — e.g., "Ring the bell, second floor"

**Validation:** All three fields (address, name, phone) are required before proceeding.

### Step 3: Drop-off Address (`/dropoff-address`)

**Progress indicator:** Step 2 of 2

The user provides:
1. **City / Address** — same autocomplete flow as pickup
2. **Recipient Name** — name of the person receiving the package
3. **Recipient Phone** — contact number for delivery
4. **Building Detail** (optional) — apartment/suite number
5. **Delivery Notes** (optional) — e.g., "Leave with security guard"

**Validation:** At minimum, the address is required.

### Step 4: Size & Weight (`/size-weight`)

| Size | Label | Weight Limit |
|------|-------|-------------|
| `s` | Small | Up to 2 kg |
| `m` | Medium (default) | Up to 8 kg |
| `l` | Large | Up to 20 kg |
| `xl` | Extra Large | Up to 50 kg |

- **Default weight:** 5.5 kg (user can adjust)
- **Special Instructions** (optional): free-text field for handling notes
- A suggested vehicle type is shown based on the selected package size

### Step 5: Pickup Time (`/pickup-time`)

Two options:

| Option | Behavior |
|--------|----------|
| **Deliver Now** | Creates the order immediately with `status = 'searching'` — dispatch starts right away |
| **Schedule for Later** | Opens a date + time picker. Creates the order with `status = 'scheduled'` — dispatch does NOT start until the scheduled time |

- Date picker: cannot select past dates
- Time picker: 12-hour format (hour, minute, AM/PM)
- Scheduled time is stored as an ISO 8601 timestamp

### Step 6: Quote Summary & Confirm (`/quote-summary`)

This is the final review screen before creating the delivery. It shows:

**Route Map:** Visual preview with the pickup-to-dropoff route polyline

**Package Summary Chips:**
- Category (e.g., "Documents")
- Size (e.g., "Medium")
- Weight (e.g., "5.5 kg")
- Distance (e.g., "12.3 km")

**Fare Breakdown:**

```
Base fare .......................... ₦{base_price}
Distance: {km} km × ₦{per_km} ..... ₦{distance_cost}
Weight: {weight} kg × ₦10 ......... ₦{weight_cost}
───────────────────────────────────────
Total .............................. ₦{total}
```

**Payment Method:** User selects COD or Bank Transfer (see Section 6)

**"Create req & pay" Button:**
- Enabled only when: pickup, dropoff, price, and payment method are all set
- Protected by a **duplicate-submission guard** — multiple rapid taps will not create duplicate orders
- On tap: delivery row is inserted into the database

**After Confirmation:**
- Draft order is cleared (all temporary data removed)
- **Immediate orders** → user is navigated to the "Finding Your Rider" screen
- **Scheduled orders** → user is navigated to the "Scheduled Order" confirmation screen

---

## 5. Pricing Algorithm & Fare Calculation

### 5.1 Pricing Source

| Parameter | Source | Fallback |
|-----------|--------|----------|
| `base_price` | `pricing_settings` table (row id=1) | ₦150 |
| `per_km_price` | `pricing_settings` table (row id=1) | ₦180 |
| `per_kg_price` | Constant in app code | ₦10 |

- Pricing values are fetched from the database and **cached for 2 minutes** to reduce API calls
- The `pricing_settings` table is admin-managed (can be updated without app deployment)

### 5.2 Fare Formula

```
Total Price = Base Price + (Distance in km × Per-km Price) + (Weight in kg × ₦10)
```

**Example:**
```
Base fare:   ₦150
Distance:    12.3 km × ₦180 = ₦2,214
Weight:      5.5 kg × ₦10   = ₦55
─────────────────────────────────────
Total:       ₦2,419
```

### 5.3 Distance Calculation

Distance is calculated using a two-tier approach:

1. **Primary:** Google Maps Directions API (via the backend proxy at `fam.ubiqco.com/geo`)
   - Returns actual driving distance and estimated duration
   - Backend timeout: 3.5 seconds
2. **Fallback:** If the Directions API fails or times out, the app calculates a straight-line (Haversine) distance between pickup and dropoff coordinates

### 5.4 Instant Quote (No Booking)

The user can get a fare estimate without committing to a delivery via the **Get Quote** action on Home. This screen allows entering pickup/dropoff addresses and package size to see the estimated price, distance, and duration — no order is created.

---

## 6. Payment Processing

### 6.1 Available Payment Methods

| Method | Code | Receipt Required | Description |
|--------|------|-----------------|-------------|
| Cash on Delivery | `cod` | No | User pays the rider in cash upon package delivery |
| Bank Transfer | `bank_transfer` | Yes (photo) | User transfers payment to FAMO's bank account and uploads proof |

### 6.2 Bank Transfer Details

When the user selects Bank Transfer, the following details are displayed:

| Field | Value |
|-------|-------|
| Bank | Guaranty Trust Bank (GTBank) |
| Account Name | Fast Motion Logistics Ltd |
| Account Number | 0123456789 |

### 6.3 Receipt Upload Flow (Bank Transfer)

1. User taps "Upload Receipt"
2. Device photo library opens (image picker)
3. User selects a photo of the transfer receipt (PNG/JPG)
4. Image is stored temporarily in app memory (base64 encoded)
5. On order confirmation, the receipt is uploaded to secure cloud storage
6. Storage path: `payment-receipts/{user_id}/receipts/receipt-{timestamp}.{extension}`
7. The public URL is stored in the delivery record as `payment_screenshot_url`

### 6.4 Payment Validation

- **COD:** No validation needed — payment happens at delivery
- **Bank Transfer:** The "Create req & pay" button is only enabled after a receipt image has been selected

---

## 7. System Dispatch & Rider Assignment

### 7.1 How Dispatch is Triggered

When a user confirms an **immediate delivery** (status = `searching`):

```
User taps "Create req & pay"
    ↓
Delivery row inserted into database (status = 'searching')
    ↓
Database trigger fires automatically
    ↓
Trigger identifies nearby available riders in the service area
    ↓
Delivery offer sent to nearest qualified rider(s)
    ↓
First rider to accept → delivery status updated to 'accepted'
    ↓
User app receives real-time notification → screen transitions
```

### 7.2 "Finding Your Rider" Screen

After the order is created, the user sees:

- **Animated radar** with pulsing rings (visual feedback that the system is searching)
- **Animated delivery bike** icon in the center
- **Timeline progress indicator:**
  - ✅ Step 1: "Received" — order is in the system
  - 🔵 Step 2: "Searching" — actively looking for a rider (pulsing animation)
  - ⚪ Step 3: "Arriving" — pending (shown after rider accepts)
- **Shipment summary** card with package category and route
- **"Cancel Request"** button

### 7.3 Real-Time Status Updates

The app uses **two parallel mechanisms** for reliability:

| Mechanism | How it works | Purpose |
|-----------|-------------|---------|
| **Supabase Realtime** | Subscribes to Postgres Changes on the `deliveries` table, filtered by delivery ID | Instant push when rider accepts or status changes |
| **Polling fallback** | Fetches the delivery row from the database every **4 seconds** | Catches updates if the real-time connection drops (e.g., app backgrounded, flaky network) |

### 7.4 Automatic Screen Transitions

When the delivery status changes, the app automatically navigates:

| New Status | Action |
|------------|--------|
| `accepted` | → Navigate to **Rider Assigned** screen |
| `picked_up` | → Navigate to **Rider Assigned** screen |
| `cancelled` | → Navigate back (rider or system cancelled) |

---

## 8. Live Tracking & Real-Time Updates

### 8.1 Rider Assigned Screen

When a rider accepts the delivery, the user sees:

- **Rider profile:** Avatar, full name, star rating (e.g., 4.9 ★), total trip count
- **Action buttons:** Call rider, Send message (Chat)
- **Delivery route summary**
- **Package details**

### 8.2 Live Tracking Map

Once tracking begins (status = `accepted` or `picked_up`), the user sees:

- **Google Map** showing:
  - Rider's live position (updated approximately every 10 seconds)
  - Pickup location marker
  - Dropoff location marker
  - Route polyline (driving directions)
- **Status pill** at the top: "Rider on the way" / "In transit"
- **Rider's real-time coordinates** (displayed to 4 decimal places)

### 8.3 Rider Location Updates

| Source | Channel | Update Frequency |
|--------|---------|-----------------|
| Broadcast | `delivery-tracking:{delivery_id}` | ~10 seconds |
| Fallback seed | `rider_locations` table row | On screen load (if no broadcast yet) |

The rider's app emits `{ lat, lng, heading }` on the broadcast channel. The user app animates the rider marker smoothly between positions.

### 8.4 Tracking Details Panel (Pull-up Card)

The bottom panel displays:

- **Rider info:** Avatar, name, rating, trips completed
- **Call button** → initiates phone call to rider
- **Chat button** → opens in-app messaging (with unread count badge)
- **Tracking Number:** Format `FAMO-{XXXXX}` (last 5 characters of the delivery UUID, uppercased)
  - Example: `FAMO-549BF`
  - Copyable to clipboard
- **Package tags:** Category, size, weight, fare
- **Share Trip** button
- **Cancel Delivery** button

---

## 9. Cancellation Rules & Constraints

### 9.1 When Can a User Cancel?

| Delivery Status | Can Cancel? | Notes |
|----------------|-------------|-------|
| `searching` | ✅ Yes | No rider assigned yet — free cancellation |
| `accepted` | ✅ Yes | Rider assigned but hasn't picked up — **cancellation fee warning** shown |
| `picked_up` | ❌ No | Rider has the package — cancellation blocked |
| `delivered` | ❌ No | Delivery completed — cancellation blocked |
| `cancelled` | ❌ No | Already cancelled |
| `scheduled` | ✅ Yes | Can be deleted before scheduled time |

### 9.2 Cancellation Flow

1. User taps "Cancel" (available on Finding Rider or Live Tracking screens)
2. **Cancel Delivery screen** opens
3. User must select a **reason** (required):

| Reason |
|--------|
| Booked by mistake |
| Rider taking too long |
| Found a cheaper option |
| Changed pickup or drop-off |
| No longer need delivery |
| Other reason |

4. User can add **optional notes**
5. **Warning displayed:** *"A cancellation fee may apply if your rider has already started the trip."*
6. User confirms cancellation
7. Backend RPC `user_cancel_delivery(delivery_id)` is called

### 9.3 Backend Cancellation Logic

The backend validates and processes:

```
Receive cancellation request
    ↓
Check current delivery status:
    ↓
    If status = 'picked_up'  → ERROR: "cannot_cancel_picked_up"
    If status = 'delivered'  → ERROR: "cannot_cancel_delivered"
    If status = 'cancelled'  → ERROR: "cannot_cancel_cancelled"
    ↓
Set delivery status → 'cancelled'
    ↓
If rider was assigned → free the rider (make available for new deliveries)
    ↓
Return success → User navigated to Home
```

### 9.4 Cancellation Summary

```
┌─────────────────────────────────────────────────────┐
│                 CANCELLATION WINDOW                  │
│                                                     │
│  ORDER CREATED ──── RIDER ASSIGNED ──── PICKED UP   │
│       │                   │                 │       │
│   ✅ Cancel OK       ✅ Cancel OK       ❌ LOCKED   │
│   (Free)           (Fee may apply)    (Cannot cancel)│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 10. Delivery Completion & Rating

### 10.1 Completion Flow

1. Rider arrives at the dropoff location
2. Rider marks the delivery as complete in the Rider App
3. Delivery status → `delivered`
4. User app receives the update (real-time or polling)
5. User is automatically navigated to the **Delivery Success** screen

### 10.2 Delivery Success Screen

Displays:
- **Rider profile** (avatar, name)
- **Order summary:** package contents, weight, total amount paid
- **Star rating widget** (0–5 stars) — user can rate the rider
- **Share delivery** option
- **Help & Support** access

---

## 11. Scheduled (Future) Deliveries

### 11.1 How Scheduling Works

| Aspect | Behavior |
|--------|----------|
| Created with | `status = 'scheduled'`, `scheduled_at = ISO timestamp` |
| Dispatch | Does **NOT** start at creation time — the backend trigger ignores `scheduled` orders |
| Activation | At the scheduled time, the backend changes status to `searching` and dispatch begins |
| Visibility | Appears under the "Scheduled" tab in the Orders screen |
| Cancellation | User can delete/cancel before the scheduled time |

### 11.2 Scheduled Order Confirmation

After booking a scheduled delivery, the user sees:
- Confirmation screen with the scheduled date and time
- Package and route details
- Option to manage or cancel the scheduled order

---

## 12. Order Management

### 12.1 Orders Screen (Three Tabs)

| Tab | Statuses Shown | Actions Available |
|-----|---------------|-------------------|
| **Active** | `searching`, `accepted`, `picked_up` | Track delivery |
| **Scheduled** | `scheduled` | View details, cancel |
| **Completed** | `delivered`, `cancelled` | View details |

### 12.2 Order Card Information

Each order card displays:
- **Tracking code:** `FAMO-{XXXXX}`
- **Pickup → Dropoff** addresses
- **Status badge** (color-coded):

| Status | Badge Color |
|--------|-------------|
| `searching` | Purple |
| `accepted` | Blue |
| `picked_up` | Purple |
| `scheduled` | Purple |
| `delivered` | Gray |
| `cancelled` | Red |

- **Created time:** "Today", "Yesterday", or full date
- **Action button:** "Track" (active) or "Details" (completed)

### 12.3 Track by Code

Users can also find an order by entering the tracking code (e.g., `FAMO-549BF`) on the **Track Package** screen accessible from Home.

---

## 13. In-App Chat

### 13.1 Chat System

| Feature | Details |
|---------|---------|
| Channel | `delivery-chat:{delivery_id}` |
| Storage | `messages` table in PostgreSQL |
| Real-time | Supabase Postgres Changes subscription |
| Persistence | Messages survive app restarts and reconnects |

### 13.2 Message Structure

Each message contains:
- **Sender ID** — who sent it (user or rider)
- **Sender Role** — `'user'` or `'rider'`
- **Body** — message text
- **Timestamp** — when it was sent

### 13.3 Unread Indicator

The Chat button on the Live Tracking screen shows an **unread badge** when new messages from the rider are available.

---

## 14. Cold-Start Resume Logic

When the user opens the app after it was fully closed:

```
App Opens
    ↓
Check database for active delivery
(status in: 'searching', 'accepted', 'picked_up')
    ↓
┌──── Active delivery found? ────┐
│                                │
│  YES                           │  NO
│  ↓                             │  ↓
│  Status = 'searching'?         │  Restore last
│  → /finding-rider              │  saved screen
│                                │  (or Home)
│  Status = 'accepted'           │
│  or 'picked_up'?               │
│  → /live-tracking              │
│                                │
└────────────────────────────────┘
```

**Key principle:** The database is the source of truth, not the last visited screen. If a rider accepted while the app was closed, reopening goes directly to the tracking screen.

---

## 15. Delivery State Machine (All Statuses)

```
                    ┌──────────────┐
                    │   SCHEDULED  │ (created with future time)
                    └──────┬───────┘
                           │ (scheduled time arrives)
                           ▼
┌──────────┐      ┌──────────────┐
│  ORDER   │ ───▶ │  SEARCHING   │ (dispatch active, looking for riders)
│ CREATED  │      └──────┬───────┘
└──────────┘             │
                         │ (rider accepts)
                         ▼
                  ┌──────────────┐
                  │   ACCEPTED   │ (rider assigned, heading to pickup)
                  └──────┬───────┘
                         │ (rider arrives at pickup, collects package)
                         ▼
                  ┌──────────────┐
                  │  PICKED UP   │ (rider has package, heading to dropoff)
                  └──────┬───────┘
                         │ (rider delivers package)
                         ▼
                  ┌──────────────┐
                  │  DELIVERED   │ (complete — user can rate)
                  └──────────────┘

     At any point before PICKED UP:
                         │
                         ▼
                  ┌──────────────┐
                  │  CANCELLED   │ (by user, rider, or system)
                  └──────────────┘
```

### Status Definitions

| Status | Meaning | User Can Cancel? | Rider Assigned? |
|--------|---------|-----------------|----------------|
| `scheduled` | Waiting for scheduled time | Yes | No |
| `searching` | Actively looking for a rider | Yes | No |
| `accepted` | Rider assigned, en route to pickup | Yes (fee warning) | Yes |
| `picked_up` | Rider has the package | No | Yes |
| `delivered` | Package delivered to recipient | No | Yes |
| `cancelled` | Order was cancelled | N/A | Maybe |

---

## 16. Database Schema Summary

### 16.1 Deliveries Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key → authenticated user |
| `rider_id` | UUID (nullable) | Foreign key → assigned rider |
| `status` | Text | One of: searching, accepted, picked_up, delivered, cancelled, scheduled |
| `pickup_address` | Text | Formatted pickup address |
| `pickup_lat` / `pickup_lng` | Float | Pickup coordinates |
| `dropoff_address` | Text | Formatted dropoff address |
| `dropoff_lat` / `dropoff_lng` | Float | Dropoff coordinates |
| `sender_name` | Text | Name of person at pickup |
| `sender_phone` | Text | Phone number at pickup |
| `recipient_name` | Text | Name of person at dropoff |
| `recipient_phone` | Text | Phone number at dropoff |
| `package_category` | Text | documents, electronics, fragile, food, other |
| `package_description` | Text | Custom description (for "other" category) |
| `package_size` | Text | s, m, l, xl |
| `weight` | Float | Package weight in kg |
| `price` | Float | Calculated fare in ₦ |
| `payment_method` | Text | cod, bank_transfer |
| `payment_screenshot_url` | Text (nullable) | URL to uploaded receipt image |
| `pickup_notes` | Text (nullable) | Instructions for pickup |
| `dropoff_notes` | Text (nullable) | Instructions for dropoff |
| `special_instructions` | Text (nullable) | Package handling notes |
| `scheduled_at` | Timestamp (nullable) | Scheduled delivery time |
| `accepted_at` | Timestamp (nullable) | When rider accepted |
| `created_at` | Timestamp | Order creation time |
| `updated_at` | Timestamp | Last update time |

### 16.2 Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Foreign key → auth.users |
| `full_name` | Text | User's display name |
| `email` | Text | User's email address |
| `phone_number` | Text | User's phone number |
| `avatar_url` | Text | Profile picture URL |

### 16.3 Pricing Settings Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Always 1 (single row) |
| `base_price` | Float | Base fare in ₦ (default: 150) |
| `per_km_price` | Float | Per-kilometer charge in ₦ (default: 180) |

### 16.4 Messages Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `delivery_id` | UUID | Foreign key → deliveries |
| `sender_id` | UUID | Who sent the message |
| `sender_role` | Text | 'user' or 'rider' |
| `body` | Text | Message content |
| `created_at` | Timestamp | When sent |

---

## 17. Edge Cases & Error Handling

### 17.1 Network & Connectivity

| Scenario | Handling |
|----------|---------|
| Realtime connection drops | 4-second polling fallback ensures status changes are always detected |
| Google Maps API unavailable | Falls back to Haversine (straight-line) distance for pricing |
| Backend proxy timeout (>3.5s) | Direct Google API call as fallback |
| App killed during "Finding Rider" | Cold-start resume detects active delivery and navigates to correct screen |

### 17.2 Duplicate Prevention

| Scenario | Handling |
|----------|---------|
| User taps "Create req & pay" multiple times rapidly | Synchronous guard (`useRef`) blocks re-entry before any async operation begins |
| Button state lag (React state update delay) | Guard fires synchronously, independent of React's render cycle |

### 17.3 Data Integrity

| Scenario | Handling |
|----------|---------|
| User has no profile row | Profile save uses `upsert` (creates row if missing, updates if exists) |
| Session token expired | `getSession()` returns cached session; Supabase SDK handles refresh |
| Rider cancels after accepting | Status reverts to `searching` → user is returned to "Finding Rider" screen for re-dispatch |

### 17.4 Real-Time Reliability

The app uses **REPLICA IDENTITY FULL** on the `deliveries` table. This ensures that Supabase Realtime UPDATE events include all row columns (not just the primary key), which is required for Row-Level Security filtering to work correctly on real-time subscriptions.

---

*This document describes the FAMO User App as of version 1.0.0 (June 2026). All workflows, statuses, and business rules are derived from the production codebase.*
