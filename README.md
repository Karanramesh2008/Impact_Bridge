# ImpactBridge

### AI-Powered CSR–NGO Partnership & Tender Platform

ImpactBridge connects **CSR companies** with verified **NGO implementation partners**. It combines AI-powered NGO matching with a role-based tender and quotation workflow so CSR teams can discover partners, invite NGOs, compare proposals, and select the most suitable implementation partner.

## 🚀 Key Features

### 1. CSR Dashboard
- Create CSR initiatives with domain, location, and budget requirements.
- Run the NGO matching engine.
- View recommended NGO partners and AI insights.
- Review compatibility, impact potential, budget fit, and due-diligence indicators.
- Invite suitable NGOs to a competitive CSR tender.
- Logout securely from the dashboard.

### 2. NGO Partner Flow
NGOs can register/login as an **NGO Partner** and access the tender workspace.

**NGO flow:**

`Login as NGO → View Invited Tenders → Open Tender → Enter Price → Enter Timeline → Add Proposal → Submit Quotation`

NGOs only see tenders for which their email has been invited.

### 3. CSR Tender & Quotation Flow

**CSR flow:**

`Create Tender → Invite Multiple NGOs → Receive Quotations → Compare Bids → Optimize It → Select Quote → Award Tender`

Each quotation contains:
- NGO name/email
- Quoted price
- Delivery timeline
- Implementation proposal
- Quotation status

The **Optimize It** option recommends a quotation using a balanced cost and delivery-speed score, while CSR users can also manually select a quote.

### 4. Authentication & Roles
- Login and Sign Up UI.
- Role selection: **CSR Company** or **NGO Partner**.
- HTTP-only authentication cookie.
- Logout flow.
- Role stored in the current client session context without changing the existing login database schema.
- Existing login/user data structure is preserved.

> **Hackathon note:** Authentication and tender data currently use lightweight demo-grade storage/in-memory state. A production deployment should use a proper database, secure session management, password hashing such as Argon2/bcrypt, validation, and audit logging.

## 🏗️ Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend / APIs
- Next.js API routes for authentication and tender/quotation workflow
- FastAPI backend for NGO matching and existing AI services
- Python

### AI & Matching
- AI-assisted NGO analysis
- NGO compatibility scoring
- Impact and risk scoring
- Budget-fit analysis
- Tender quotation optimization

## 📁 Important Project Structure

```text
Impact_Bridge/
├── app/
│   ├── auth/                 # Login / Sign Up UI
│   ├── api/
│   │   ├── auth/             # Authentication API
│   │   └── tenders/           # Tender & quotation API
│   ├── tenders/               # CSR / NGO tender workspace
│   ├── page.tsx               # CSR dashboard
│   └── mockData.json          # Demo NGO data
│
├── backend/
│   ├── main.py                # FastAPI application
│   ├── matching.py            # NGO matching/scoring logic
│   ├── ai_service.py          # AI service integration
│   └── requirements.txt       # Python dependencies
│
├── data/
│   └── users.json             # Demo authentication users
│
├── lib/
│   └── tender-store.ts        # In-memory tender/quotation store
│
├── middleware.ts              # Authentication route protection
└── README.md
```

## ⚙️ Running Locally

### 1. Frontend

From the project root:

```bash
cd Impact_Bridge
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### 2. FastAPI Backend

Open another terminal:

```bash
cd Impact_Bridge/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The frontend should use the backend URL through `NEXT_PUBLIC_API_URL` in `.env.local`, for example:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 👥 User Experience

### CSR Company
1. Sign up/login as **CSR Company**.
2. Create a CSR initiative.
3. Run NGO matching.
4. Review recommended NGOs.
5. Invite NGOs to a tender.
6. Create and publish a tender with invited NGO emails.
7. Review incoming quotations.
8. Use **Optimize It** or manually select a quotation.
9. Award the tender.
10. Logout.

### NGO Partner
1. Sign up/login as **NGO Partner**.
2. Enter the tender workspace.
3. View tenders invited to the NGO's email.
4. Open a tender.
5. Submit quotation amount.
6. Enter delivery timeline.
7. Add an implementation proposal.
8. Submit the quotation.
9. Wait for CSR selection.
10. Logout.

## 🔐 Data & Schema Safety

The tender workflow is intentionally modular and uses an in-memory store for the hackathon implementation. It does **not** require changes to the existing core login database schema or existing user table structure.

## 🎯 Hackathon Objective

ImpactBridge aims to make CSR implementation more **transparent, data-driven, and efficient** by connecting organizations with suitable NGO partners and providing a structured tender process for competitive, evidence-based partner selection.

## 📌 Current Status

This project is a **hackathon prototype** focused on demonstrating the complete CSR-to-NGO discovery and tender workflow. Some services use demo/in-memory data and should be replaced with persistent production infrastructure before deployment at scale.
