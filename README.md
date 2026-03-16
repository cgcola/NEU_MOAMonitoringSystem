# NEU MOA Monitoring System

A comprehensive, real-time full-stack web application designed to manage, track, and secure Memorandums of Agreement (MOAs) for New Era University. Built to streamline the internship and partnership pipeline between the university and Host Training Establishments (HTEs).

**[View Live Application Here](https://neu-moa-monitoring-system-orpin.vercel.app/)**

---

## Key Features

### Advanced Role-Based Access Control (RBAC)
The system automatically routes users to customized dashboards based on their assigned roles:
* **Admins:** Full control over all MOAs, User Management, and System Audit Logs.
* **Faculty (Maintainers):** Granted specific rights to add, edit, and manage MOA records for their respective colleges.
* **Faculty (Viewers):** Can browse and monitor active MOAs for student advising.
* **Students:** Can browse actively approved MOAs to find internship opportunities and view company contact details.

### Real-Time Database & Security
* **Instant Updates:** Powered by WebSockets, MOA status changes and new user registrations appear on the dashboard instantly without refreshing the page.
* **"Ejector Seat" Security:** If an Admin blocks a user, Supabase Realtime immediately catches the database update and forcefully logs the user out of the application, regardless of what screen they are on.
* **Automated Postgres Triggers:** User profiles are securely and automatically generated at the database level the moment a new user logs in via Google Auth.

### MOA Lifecycle Management
* **Smart Status Tracking:** MOAs are categorized by their exact phase (e.g., *Processing - Sent to Legal*, *Approved - Signed by President*).
* **Automated Expiration:** The system intelligently flags MOAs as "Expiring Soon" (2 months prior) or "Expired" based on their effective dates.
* **Soft Deletion (Recycle Bin):** Deleted MOAs are hidden from the active system but securely retained in the database, allowing Admins to view or restore them at any time.

### Comprehensive User Management
* **Seamless Google Onboarding:** Users sign in with their `@neu.edu.ph` Google accounts. First-time users are caught by a mandatory onboarding modal to lock in their College affiliation.
* **Pre-Assignment:** Admins can proactively add users to a "Waiting List" via email, automatically assigning them custom roles (like Faculty Maintainer) the moment they log in.
* **Live Toggles:** Instantly grant/revoke MOA editing rights or block/unblock accounts with a single click.

### Immutable Audit Trails
* Every single creation, edit, or deletion of a MOA is securely logged.
* Admins can view the exact timestamp, user email, and specific data changes (before and after) for full accountability.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, HTML5, CSS3
* **Backend as a Service (BaaS):** Supabase
* **Database:** PostgreSQL
* **Authentication:** Supabase Auth (Google OAuth Provider)
* **Realtime:** Supabase Realtime Channels
* **Hosting/Deployment:** Vercel

---

## ⚙️ Local Setup & Installation

To run this project locally on your machine, follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/neu-moa-monitoring-system.git](https://github.com/YOUR_GITHUB_USERNAME/neu-moa-monitoring-system.git)
cd neu-moa-monitoring-system
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup Environment Variables**
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Start the development server**
```bash
npm run dev
```

---

## Database Architecture Highlights
* **Profiles Table:** Stores user roles, college affiliations, and block statuses.
* **MOAs Table:** Stores company details, effective/expiration dates, and dynamic statuses.
* **Pending Roles Table:** A queue system for Admins to assign roles to emails before the user has registered.
* **Audit Logs Table:** A trigger-fed table that records every `INSERT`, `UPDATE`, and `DELETE` operation on the MOAs table.
* **PostgreSQL Triggers:** Custom `plpgsql` functions handle data normalization, profile creation, and complex string casing to ensure absolute data integrity.

---

<br />

<div align="center">
  <p><i>Developed by Carl Geneson Ola</i></p>
  <p><b>Designed and Developed for New Era University</b></p>
</div>
