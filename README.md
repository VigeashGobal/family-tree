# Lignée — Family Tree

An elegant family tree app built with Next.js, Convex, and Tailwind CSS. Designed with a refined, Chanel-inspired aesthetic.

## Features

- Add family members with name, photo, job, birthday, and email
- Link new members to existing ones (parent, child, spouse, sibling)
- Interactive tree visualization with relationship lines
- Click any member to view their full profile
- Real-time updates via Convex

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will prompt you to log in and create a Convex project. It automatically writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

### 3. Run the dev server

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Create a production Convex deployment:

   ```bash
   npx convex deploy
   ```

4. Add `NEXT_PUBLIC_CONVEX_URL` to your Vercel environment variables (use the production Convex URL)

## Tech Stack

- **Next.js 16** — React framework
- **Convex** — Database, file storage, real-time sync
- **Tailwind CSS 4** — Styling
- **Vercel** — Hosting
