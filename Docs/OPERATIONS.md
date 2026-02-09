# Zo Node: Operations

> **How a Zo Node runs day-to-day through the House Captain system.**

---

## Overview

| Metric | Value |
|--------|-------|
| **Operational Phases** | 6 |
| **Active Shift** | 12 hours (8 AM - 8 PM) |
| **System Touchpoints** | 8 |
| **Daily Actions** | 50+ |

---

## The 6 Operational Phases

### Phase 1: Shift Commencement & Digital Audit
**Time**: 8:00 AM - 9:30 AM (1.5 hours)

**Objective**: Assess property status and prepare for guest transitions

1. System login via SDK/Passport (OTP verification)
2. WhatsApp group scan for 'Before & After' photos from night shift
3. Eezee system review: Check-ins, Check-outs, payment status
4. PM Tool check: Verify web check-in documents uploaded
5. Review overnight incidents or guest complaints
6. Prepare priority list based on occupancy

**Systems**: SDK/Passport, WhatsApp Groups, Eezee PMS, PM Tool (zo.xyz/pm)

---

### Phase 2: Physical Inspection & Staff Mobilization
**Time**: 9:30 AM - 11:30 AM (2 hours)

**Objective**: Ensure physical property matches digital standards

1. Morning walkthrough: Lobby → Flow Zone → Kitchen → Washrooms → Common Areas
2. 25-item visual inspection checklist
3. Supply restocking: Handwash, paper towels, toilet paper
4. Bot task supervision: Verify zone assignments sent to staff
5. Review staff 'Before & After' photo submissions
6. Approve work or flag for correction
7. Kitchen & inventory check: KOT review, stock levels
8. Flag maintenance issues for repair

**Systems**: WhatsApp Bot, Physical checklist, Kitchen inventory

---

### Phase 3: Financial Management & Procurement
**Time**: 11:30 AM - 2:00 PM (2.5 hours)

**Objective**: Update financial records and manage cash flow

1. Master Workbook updates: Revenue entry (Accommodation & Events)
2. Verify payment data from Eezee PMS + manual records
3. Categorize payment method, verify amounts
4. Opex & Capex logging:
   - Items < ₹5,000 → Opex sheet
   - Items > ₹5,000 → Capex sheet
5. Procurement: Hyperpure bulk orders (2-3x weekly)
6. Emergency procurement: Blinkit/local stores with imprest cash
7. Bill digitization: Photo → store for records

**Systems**: Master Workbook (Excel), Eezee PMS, Hyperpure, Blinkit

---

### Phase 4: Recreation, Activities & Amenities
**Time**: 2:00 PM - 4:30 PM (2.5 hours)

**Objective**: Maintain premium guest experience

1. Activity schedule upload to Activity Manager
2. Sync schedules to Zoster/Playo platforms
3. Amenity custody check: Pickleball, archery equipment
4. Co-working setup: Flow Zone preparation, desk allocation
5. Pool audit: Chlorine levels, backwash, cleaning
6. Garden supervision: Irrigation check, landscaping
7. Guest activity coordination and support

**Systems**: Activity Manager, Zoster/Playo, Equipment inventory

---

### Phase 5: Staff Supervision & Quality Audit
**Time**: 4:30 PM - 6:30 PM (2 hours)

**Objective**: Evaluate performance and property hygiene

1. Daily Housekeeping Report analysis from WhatsApp Bot
2. Task completion vs. assignment comparison
3. Metrics review:
   - Tasks Assigned vs. Completed
   - Time per zone vs. Estimated time
   - Total reward points earned
   - Photo verification pass rate
4. Identify top performers and coaching needs
5. Asset inventory updates
6. Waste management verification
7. Final property walkthrough

**Systems**: WhatsApp Bot, Performance tracking, Asset inventory

---

### Phase 6: EOD Wrap-Up & Reporting
**Time**: 6:30 PM - 8:00 PM (1.5 hours)

**Objective**: Secure property and handover to night shift

1. Utility check: Gate lights ON, pickleball lights ON
2. Generator DB verification (power backup ready)
3. Summary sheet final review
4. Night staff briefing: pending tasks, guest issues, notes
5. Handover checklist completion
6. SDK/Passport logout with daily summary submission

**Systems**: SDK/Passport, Summary sheet, Night shift protocol

---

## Parallel Workflows

### Guest Check-In Process

```
Guest Arrival
    ↓
Check booking in Eezee
    ↓
Verify documents in PM Tool
    ↓
Payment completed?
    ├── Cash → Accept & record in Master Workbook
    └── Online → Generate payment link, wait 15 mins
    ↓
Assign room, generate key
    ↓
Welcome guest, house tour, share WiFi
    ↓
Add to WhatsApp community group
    ↓
✅ Check-in complete
```

### Guest Check-Out Process

1. Verify departure time with guest
2. Room inspection for damages/missing items
3. Process additional charges if applicable
4. Collect keys/access cards
5. Update Eezee with check-out confirmation
6. Trigger room turnover task to housekeeping
7. Remove guest from WhatsApp group
8. Request Google review

### Maintenance Escalation

```
Issue Reported
    ↓
Safety critical?
    ├── YES → Immediate guest relocation + emergency vendor
    └── NO  → Schedule based on priority
```

---

## The 6 Sub-Teams

Each House Captain manages 6 operational sub-teams:

| Team | Responsibilities |
|------|------------------|
| **Housekeeping** | Room turnover, common area cleaning, laundry |
| **Kitchen Staff** | F&B service, inventory, KOT management |
| **Gardener** | Landscaping, irrigation, outdoor maintenance |
| **Pool Maintenance** | Chlorine levels, cleaning, equipment |
| **Security** | Access control, night watch, incident response |
| **External Vendors** | Specialized repairs, equipment servicing |

---

## Systems Used

| System | Purpose |
|--------|---------|
| **SDK/Passport** | Attendance, shift logging |
| **Eezee PMS** | Bookings, payments, guest data |
| **PM Tool** | Web check-in document verification |
| **WhatsApp Bot** | Staff task assignments, photo verification |
| **Master Workbook** | Financial tracking, P&L |
| **Hyperpure** | Bulk procurement |
| **Activity Manager** | Schedule activities |
