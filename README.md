XPerience — Turn Your Life Into an RPG

Level up your real life. Complete real-world quests, earn XP and Gold, build your character, maintain streaks, and grow your hero over time.

🌐 Live Demo: https://xperience-rpg.vercel.app/

XPerience is a full-stack gamification platform that turns everyday goals into an RPG-style progression system. Instead of treating a to-do list as a simple checklist, XPerience gives users a persistent hero, quests, rewards, stats, inventory, and progression.

✨ Highlights
🎮 RPG-style progression — level up as you complete real-world activities.
⚔️ Real-life quests — create, start, and complete quests with difficulty-based rewards.
⭐ XP system — quest completion contributes to hero progression.
🪙 Gold economy — earn Gold from completed quests and use it inside the experience.
🔥 Streak tracking — build consistency through daily activity.
🧙 Hero / Character profile — customize display name, username, avatar, and archetype.
📊 Stats dashboard — visualize progress and character state.
🎒 Inventory & Shop — manage earned items and in-app resources.
🔐 Authentication — Supabase-powered sign up, login, logout, and password recovery.
🛡️ Row Level Security (RLS) — user-owned data is protected at the database layer.
⚡ Next.js full-stack architecture — React + TypeScript with Supabase integration.
📱 Responsive UI — designed for desktop and mobile-sized screens.
🌐 Live Demo

Experience XPerience here:

https://xperience-rpg.vercel.app/

Do the work in real life. Level up in XPerience.

🧩 Tech Stack
Layer	Technology
Frontend	Next.js + React + TypeScript
Styling	Tailwind CSS
Backend / Database	Supabase + PostgreSQL
Authentication	Supabase Auth
Security	PostgreSQL Row Level Security (RLS)
Package Manager	npm
Deployment	Vercel
🏗️ Core Architecture
User
  ↓
Next.js UI
  ↓
Supabase Auth
  ↓
Authenticated Session
  ↓
PostgreSQL + RLS
  ↓
Profiles / Quests / Progress / Inventory / Rewards


The application uses authenticated user sessions to associate data with the current user. Database access is protected with RLS policies so users should only be able to access records they are authorized to access.

🚀 Main User Flows
Authentication

Users can:

Create an account
Log in
Log out
Reset their password
Return through the authentication callback flow
Character / Hero

Each user has an RPG-style character profile containing information such as:

Display name
Hero username
Avatar
Archetype (for example: Warrior, Sage, Creator)
Level / progression
XP
Rank / hero state
Real-Life Quests

Users can create quests with values such as:

Quest title
Description / rules
Difficulty
XP reward
Gold reward

Typical quest flow:

Create Quest
   ↓
Start Quest
   ↓
Active
   ↓
Complete Quest
   ↓
XP + Gold + Progress updates

Stats & Progression

The dashboard surfaces the user's RPG state, including:

Level
XP progress
Streak
Gold
Character attributes
Quest progress
Inventory & Shop

Users can view earned inventory and interact with the in-app economy.

Navigation

The experience is organized around major areas such as:

Hub / Dashboard
Quests
Stats
Inventory
Hero
🔐 Security

XPerience uses Supabase Row Level Security (RLS) to protect user-owned data.

Important rules for contributors:

Never commit .env.local.
Never expose Supabase service-role secrets in frontend code.
Keep user ownership checks enforced at the database layer.
Preserve RLS policies when changing queries or schema.
Test authenticated and unauthenticated behavior after database changes.
⚙️ Local Development
Prerequisites
Node.js
npm
A Supabase project
1. Clone the repository
git clone https://github.com/abhisheks.../XPerience.git
cd XPerience


Replace the repository URL above with the final GitHub repository URL if needed.

2. Install dependencies
npm install

3. Configure environment variables

Create a local .env.local file and add the Supabase variables required by the application.

Example:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


Use the exact variable names expected by the current codebase.

Do not commit .env.local to GitHub.

4. Run the development server
npm run dev


Then open:

http://localhost:3000


If port 3000 is already in use, Next.js may start on another available port.

5. Verify the production build
npm run lint
npm run build


These checks help catch TypeScript, linting, and production-build issues before deployment.

🗄️ Supabase Setup

The repository contains Supabase-related code and database migrations.

For a fresh environment:

Create or select a Supabase project.
Configure Supabase Auth.
Apply the required database migrations in supabase/migrations.
Verify RLS policies for user-owned tables.
Add local environment variables to .env.local.
Test sign up, login, quest creation, quest completion, profile updates, and password recovery.

For production, make sure the deployed application and Supabase project use matching configuration.

🌍 Deployment

The application is deployed on Vercel.

Live Production Application

https://xperience-rpg.vercel.app/

Typical deployment flow:

GitHub main branch
       ↓
Vercel
       ↓
Production build
       ↓
Live XPerience application

Vercel Environment Variables

Add the same required Supabase environment variables in the Vercel project settings.

Do not upload .env.local to GitHub or use it as a substitute for Vercel environment variables.

🔄 Team Git Workflow

For team development, keep feature work isolated from main.

Example branches:

main
 ├── sharma/backend-rpg
 └── bhardwaj/frontend-ui


Before starting work:

git checkout main
git pull origin main


After making changes and testing:

git add .
git commit -m "describe your change"
git push origin your-feature-branch


Then open a Pull Request into main.

Before merging
Pull the latest main.
Resolve conflicts carefully.
Run npm run lint.
Run npm run build.
Test the affected user flow.
Confirm no secrets or generated folders are being committed.
🧪 Recommended Final QA

Verify the complete journey:

Sign up
  ↓
Login
  ↓
Dashboard / Hub
  ↓
Create Character
  ↓
Create Quest
  ↓
Start Quest
  ↓
Complete Quest
  ↓
XP / Gold / Streak update
  ↓
Stats / Inventory / Hero reflect latest state
  ↓
Logout
  ↓
Login again
  ↓
Data still persists


Also test:

Password recovery
Profile editing
Refreshing pages after login
Unauthorized access to protected data
Mobile / narrow viewport layout
Production build
📁 Important Project Areas

A typical XPerience codebase includes areas such as:

src/
  app/
    auth/
    dashboard/
    hero/
    inventory/
    quests/
    stats/
    ...
  components/
  lib/
    supabase/
  types/

supabase/
  migrations/

public/
  images/


The exact file structure may evolve as features are added.

🛠️ Development Notes
Environment files

Keep local secrets out of version control:

.env.local

Generated files

Do not commit generated dependency/build folders such as:

node_modules/
.next/

Database errors

For PostgreSQL errors such as:

new row violates row-level security policy


check:

Whether the user is authenticated.
Whether the session is available when the query runs.
Whether the record contains the current user's ID.
Whether the corresponding RLS INSERT / SELECT / UPDATE policy exists.
Whether the user's profile row exists when a foreign key requires it.
🎯 Project Goal

XPerience combines:

Real-life actions + RPG progression + rewards + consistency

Do the work in real life. Level up in XPerience.

👥 Team

Built as a collaborative hackathon full-stack project.

Sharma — backend / RPG systems / integration
Bhardwaj — frontend UI / experience integration
📌 Hackathon Demo Checklist
✅ Authentication works
✅ Dashboard loads
✅ Character profile works
✅ Quest creation works
✅ Quest start / completion works
✅ XP updates correctly
✅ Gold updates correctly
✅ Streak updates correctly
✅ Stats reflect current progress
✅ Inventory displays current state
✅ Production deployment is live
✅ Mobile/desktop presentation is responsive
🎮 XPerience — Turn Your Life Into an RPG

Live Demo: https://xperience-rpg.vercel.app/

Do the work in real life. Level up in XPerience. ⚔️
