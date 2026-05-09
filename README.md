# PastQ — Past Questions Portal

A full-stack Next.js app for students to browse and download past exam questions, with an admin dashboard for uploading PDFs.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd past-questions-portal
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. In the **SQL Editor**, paste and run the entire contents of `supabase-schema.sql`
3. This creates all tables, storage bucket, and policies automatically

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_PASSWORD=your-strong-password
```

> Get your Supabase URL and anon key from: **Supabase Dashboard → Settings → API**

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
past-questions-portal/
├── app/
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Homepage (search & download)
│   ├── globals.css         # Global styles
│   └── admin/
│       └── page.tsx        # Admin dashboard
├── lib/
│   └── supabase.ts         # Supabase client + TypeScript types
├── supabase-schema.sql     # Run this in Supabase SQL Editor
├── .env.local.example      # Environment variable template
└── README.md
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `programmes` | MLS, Nursing, Pharmacy, etc. |
| `levels` | 100L, 200L, 300L, etc. |
| `sessions` | 2023/2024, 2022/2023, etc. |
| `courses` | Course code + title, linked to programme & level |
| `past_questions` | PDF URL, linked to course + session |

---

## 🔐 Admin Dashboard

Visit `/admin` to:
- Upload PDF past questions
- Add new programmes
- Add new courses

**Default password:** Set `NEXT_PUBLIC_ADMIN_PASSWORD` in `.env.local`

> ⚠️ For production, use Supabase Auth instead of a simple password.

---

## ☁️ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# NEXT_PUBLIC_ADMIN_PASSWORD
```

---

## 📦 PDF Storage Structure

PDFs are stored in Supabase Storage under the `past-questions` bucket:

```
past-questions/
└── mls/
    └── 100l/
        └── 2023-2024/
            ├── mls101-1234567890.pdf
            └── mls102-1234567891.pdf
```

---

## 🔮 Future Improvements (Phase 2+)

- [ ] PDF preview in-browser
- [ ] Search autocomplete
- [ ] Download statistics dashboard
- [ ] Student accounts & bookmarking
- [ ] Move storage to Cloudflare R2 for cheaper bandwidth
- [ ] Replace password auth with Supabase Auth (email/password or magic link)
- [ ] Dark/light mode toggle

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Hosting | Vercel |
| Language | TypeScript |
