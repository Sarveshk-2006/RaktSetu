# RAKTSETU — SYNTHETIC END-TO-END DEMO RUNBOOK
**Authoritative Operational Guide for Evaluators, Reviewers & Presenters**
**Workflow Scope**: 5-Step Prototype Lifecycle (Presentation Slide 4) | **Version**: 2.1.0-STABLE

---

## 1. Demonstration Environment Setup

### 1.1 Local Full-Stack Execution
1. **Start Backend (FastAPI)**:
   ```powershell
   cd d:\RakSetu\backend
   .\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Health Check*: Verify `http://localhost:8000/api/health` returns `{"status": "healthy", "service": "RAKTSETU Authoritative Service"}`.

2. **Start Frontend (Vite/React)**:
   ```powershell
   cd d:\RakSetu\frontend
   npm run dev
   ```
   *Access URL*: Open `http://localhost:5173/` in your browser.

3. **Cloud Production Demo (Alternative)**:
   Access the deployed cloud version: [https://raktsetu-demo.vercel.app/](https://raktsetu-demo.vercel.app/)

---

## 2. The 5-Step Prototype Workflow Walkthrough

### STEP 1 — Create & Verify Blood Requirement (Slide 4 Step 1)
1. **Navigate**: In the sidebar, click **"New Incident"** (`/incidents/create`).
2. **Form Input**:
   - **Requesting Facility**: Select or type `Ruby Hall Clinic, Pune`
   - **Blood Group**: Select `O-` (Critical negative group)
   - **Units Required**: Enter `2`
   - **Urgency Level**: Select `Critical`
   - **Zone**: Select `Pune Central`
   - **Clinical Reason**: Enter `Trauma emergency requisition`
3. **Unified Incident Deduplication Verification**:
   - If an active requirement for `Ruby Hall Clinic, Pune` with `O-` already exists, an amber **"Unified Blood Incident Coordination Alert"** banner automatically appears.
   - You can click **"View Active Incident"** to avoid fragmented parallel outreach, or proceed if this is a distinct clinical order.
4. **Submit**: Click **"Initialize Blood Incident"**.
   - *Result*: The backend creates canonical records: `REQ-YYYYMMDD-XXXX` and `INC-YYYYMMDD-XXXX`.
5. **Clinical Verification Gate**:
   - On the resulting Incident Detail page, notice the status is **"PendingVerification"**.
   - Click **"Verify Requisition"**.
   - Attending clinical officer sign-off transitions the incident status to **"Verified"** (recorded in the audit ledger).

---

### STEP 2 — Explainable Deterministic Matching (Slide 4 Step 2)
1. **Examine Candidates**:
   - In Tab 1 (**"Donor Matching"**), inspect the candidate rankings.
   - Note the deterministic scoring based on:
     - Hard eligibility constraints (ABO compatibility, 90-day cooldown clearance).
     - Geographic proximity (e.g. `3.1 km away` from Ruby Hall Clinic).
     - Reliability index and contact fatigue penalty.
2. **Explainability Breakdown**:
   - Click **"Factors ▼"** on candidate `#1` (e.g. `D-4821`).
   - Observe the score breakdown:
     - Distance Score
     - Reliability Contribution
     - Cooldown Status
3. **Privacy Inspection**:
   - Observe that donor phone numbers, email addresses, and residential coordinates are strictly masked from the operator display.

---

### STEP 3 — Progressive Response Cascade & Mobile Donor Alert (Slide 4 Step 3 & Slide 3)
1. **Initiate Cascade**:
   - Click **"Launch Wave 1"** (or click **"Manage Response Cascade"** to navigate to `/response`).
   - Wave 1 mobilizes the top 5 compatible candidates.
2. **Interactive Mobile Donor Perspective Simulation (Slide 3 Mockup)**:
   - On any candidate card, click the **"📱 Donor Alert"** button.
   - A realistic mobile simulation appears representing what the donor sees on their smartphone:
     - **Urgency Badge**: `CRITICAL BLOOD REQUEST`
     - **Facility**: `Ruby Hall Clinic, Pune` (3.1 km away, ~19 mins arrival)
     - **"Why you were selected?" Section**:
       - *Available now (Status: Ready)*
       - *3.1 km from Ruby Hall Clinic*
       - *High response history (Historical reliability)*
       - *Low recent request load (Zero outreach in >60 days)*
3. **Simulate Donor Decision**:
   - Click **"I Can Donate"** in the mobile modal.
   - The simulation records willingness to travel via `POST /api/incidents/{id}/record-response`.
   - Close the preview modal.

---

### STEP 4 — Track & Coordinate with Cryptographic Audit Trail (Slide 4 Step 4)
1. **Verify Response Recording**:
   - Notice that Wave 1 now shows `Responses: 1` and `Confirmed: 1`.
2. **Authoritative Guardrail Check (Fulfilment Separation)**:
   - Notice that **Units Secured** is still `0 / 2`.
   - *Crucial Rule*: A donor accepting a call does NOT count as a fulfilled blood unit until physical hospital delivery and transfusion verification.
3. **Audit Ledger Verification**:
   - Click on the **"Audit Log"** tab (or navigate to `/audit`).
   - Verify that all operational lifecycle events are present:
     - `CREATE_INCIDENT`
     - `VERIFY_INCIDENT`
     - `LAUNCH_WAVE_1`
     - `DONOR_RESPONSE_ACCEPTED`
   - Note the SHA-256 cryptographic state hash on each event preventing retroactive ledger alteration.

---

### STEP 5 — Fulfil & Close Incident (Slide 4 Step 5)
1. **Clinical Unit Fulfilment Confirmation**:
   - In the Incident Command action bar, click **"Confirm Fulfilment"**.
   - Enter transfusion verification details:
     - *Confirmed By*: `Dr. Ananya Joshi (Transfusion Lead)`
     - *Confirmation Source*: `Hospital Blood Bank Delivery Desk`
   - Click confirm. The status updates to **"Fulfilled"**.
2. **View Completion Certificate**:
   - The **"Incident Fulfilment & Completion Certificate"** modal automatically opens (matching Slide 4 Step 5):
     - **Status Badge**: `REQUEST FULFILLED`
     - **Response Time**: `~19 mins` from requisition to delivery
     - **Donors Mobilised**: `2 Confirmed`
     - **Units Secured**: `2 / 2 Units Delivered`
     - **Audit Ledger Hash**: Linked directly to immutable ledger
3. **Incident Closure**:
   - Close the modal and click **"Close Incident"**.
   - The incident reaches its terminal state `Closed`. No further dispatches or contacts can be initiated.

---

## 3. Explaining Authoritative vs Synthetic Data to Evaluators

When presenting RAKTSETU, use the following clear talking points:

| Aspect | Reality in Demonstration |
|---|---|
| **Incident Lifecycle & State Transitions** | **Authoritative**: Enforced strictly by PostgreSQL database and FastAPI backend logic. |
| **Donor Matching Algorithm** | **Authoritative**: Mathematical deterministic multi-factor scoring (Antigen + Haversine + Reliability). |
| **Cryptographic Audit Ledger** | **Authoritative**: SHA-256 hash chains computed dynamically on every state transition. |
| **Pune Healthcare & Donor Data** | **Synthetic**: Realistic dataset covering 45+ donors and 12 hospitals across Pune District for safe demonstration. |
| **SMS / WhatsApp Dispatches** | **Simulated / Mocked**: Recorded in internal mock dispatch queues. No live Indian telecom SMS gateways are pinged. |
| **Donor Identity Verification** | **RBAC Verified**: Role-based authentication is active for hospital operators. Aadhaar integration is a future statutory roadmap item. |

---

## 4. Recovery & Troubleshooting

- **If the backend server is restarted**:
  - Simply refresh the browser page. The state is authoritatively persisted in PostgreSQL/SQLite.
- **If navigating directly to an incident URL (`/incidents/INC-...`)**:
  - The client queries the backend directly and loads authoritative details.
- **If testing without a running backend**:
  - The frontend gracefully operates in verified local demonstration mode while clearly indicating the connection state in the top bar.
