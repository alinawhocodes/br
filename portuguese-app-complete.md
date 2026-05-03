# Portuguese Learning App — Complete Reference

---

## Part 1 — One-Time Setup (Do This First)

### Step 1 — Create the project

Open Terminal in VS Code and run:

```bash
npm create vite@latest portuguese-app -- --template react-ts
cd portuguese-app
npm install
npm install react-router-dom @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2 — Open the project in VS Code

In VS Code: **File → Open Folder** → select the `portuguese-app` folder.

This is important — Cline must be opened inside your project folder.

### Step 3 — Create Supabase project

1. Go to **supabase.com** → sign up for free
2. Create a new project (pick any name, any region)
3. Go to **Settings → API**
4. Copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `Publishable key` → this is your `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `Secret key` → this is your `SUPABASE_SECRET_KEY`

Note: if you are looking at the **Legacy anon, service_role API keys** tab, those keys still work, but they are no longer the recommended default for new projects.

### Step 4 — Create .env file

In the root of your project, create a file called `.env` with:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_sb_publishable_key_here
SUPABASE_SECRET_KEY=your_sb_secret_key_here
```

### Step 5 — Run Supabase SQL migration

1. Go to your Supabase project → **SQL Editor**
2. Paste and run this SQL:

```sql
-- profiles table
create table profiles (
  user_id uuid references auth.users on delete cascade primary key,
  confirmed boolean default false
);

-- task_stats table
create table task_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  task_id text not null,
  times_shown integer default 0,
  times_correct integer default 0,
  unique(user_id, task_id)
);

-- RLS for profiles
alter table profiles enable row level security;
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = user_id);

-- RLS for task_stats
alter table task_stats enable row level security;
create policy "Users can read own stats"
  on task_stats for select using (auth.uid() = user_id);
create policy "Users can insert own stats"
  on task_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own stats"
  on task_stats for update using (auth.uid() = user_id);

-- Auto-create profile on registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, confirmed)
  values (new.id, false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

If you disabled **Automatically expose new tables and functions** during project creation, also run this right after the migration so the frontend can read/write through the authenticated API role:

```sql
grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;
grant select, insert, update on table public.task_stats to authenticated;
```

### Step 6 — Supabase Storage

1. Go to **Storage** in your Supabase project
2. Create a new bucket called `topic-images`
3. Set it to **Public**

---

## Part 2 — Product Spec

### Overview
A personal web app for practicing Portuguese based on material provided by a teacher. Topics are managed as JSON files in the repo via Claude/Cline. The app is purely a practice interface — no in-app content generation.

---

### Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Routing:** React Router
- **Styling:** Tailwind CSS, mobile-first
- **Task Content:** Static JSON files in `/src/data/` — one file per topic
- **Auth + Data Persistence:** Supabase
- **Image Storage:** Supabase Storage (`topic-images` bucket)
- **No custom backend, no API proxy**

---

### Task Data Shape
All tasks share the same structure. Practice mode determines how they're presented.

```ts
{
  id: string
  front: string   // the prompt / question side
  back: string    // the answer side
}
```

### Topic JSON Structure
```ts
{
  id: string
  name: string
  imageUrl: string    // Supabase Storage URL
  tasks: Task[]
}
```

---

### Task Types / Practice Modes

#### Flashcard (EN→PT or PT→EN)
- Show front, user thinks, taps to flip
- After flipping: "I knew it" / "I didn't" (self-rated)
- No performance recorded in Supabase
- Direction depends on which mode user selects (EN→PT shows English front, PT→EN shows Portuguese front)

#### Write-in
- Show front as a question or fill-in-the-blank prompt
- User types answer freely and submits
- Graded with tolerance: trimmed, lowercased, diacritics normalised (falo = Falo = fàlo)
- If wrong: show correct answer before advancing
- Performance recorded in Supabase (times_shown, times_correct per task per user)

---

### Batching
- ≤15 tasks → skip batch screen, go straight to Mode Selection
- 16+ tasks → split into sequential batches of 8–15 (as evenly as possible)
- Batches are sequential slices by array index order in the JSON
- Batch Selection screen shows: Batch 1, Batch 2... (each with task count) + "All" option

---

### Navigation Flow
```
Home → Topic Selection → Batch Selection (if 16+ tasks) → Mode Selection → Practice → Results
```

---

### Views

#### Home
- List of topic cards
- Each card shows: topic name, task count, success rate (write-in only — blank if never practiced)
- Each card has a photo icon button → opens material image in a modal/lightbox
- Sort toggle: sequential (default) / worst performance first
- Tap card body → proceed

#### Batch Selection (only if 16+ tasks)
- Batch 1, Batch 2... each showing task count
- "All" option

#### Mode Selection
- Two options: Flashcards / Write-in
- Flashcards has two sub-options: EN→PT / PT→EN

#### Practice
- One task at a time, full screen
- Minimal screen: only Back button, task text, and revealed answer area
- Back button sits in the top-left corner
- Back button uses large, high-visibility text sizing
- Answer reveal must not shift the layout; reserve space for the revealed answer
- Random order within selected batch
- Session runs until user manually stops (X / End session button)
- Back/X from Practice should return to Mode Selection for the current topic and selected batch
- Tasks loop when end is reached

**Flashcard behaviour:**
Show front text only → first tap anywhere in the practice area except Back reveals answer below → second tap advances to the next card

**Write-in behaviour:**
Show front → user types answer into full-width input → Submit checks with tolerance matching and records stats → if correct, show "Correct" and Continue → if wrong, show "Incorrect" plus the correct answer and Continue

#### Results
- Write-in: score e.g. 8/12 + list of wrong answers with correct answers
- Flashcards: simple session summary (tasks seen, no score)
- Actions: Retry wrong answers / Restart / Back to Home

---

### Auth
- Register: email + password, open to anyone
- Login: email + password
- Session persisted across visits
- After registering: unconfirmed users see "Waiting for approval" screen
- You manually set confirmed = true in Supabase dashboard per trusted user
- No password reset flow in app — handled manually via Supabase dashboard
- Passwords managed entirely by Supabase Auth (never visible, bcrypt hashed)

---

### Supabase Schema

#### profiles table
```ts
{
  user_id: string       // references auth.users
  confirmed: boolean    // default false, flipped manually by admin
}
```

#### task_stats table
```ts
{
  user_id: string
  task_id: string       // matches id field in topic JSON
  times_shown: number
  times_correct: number
}
```
Write-in mode only — no stats for flashcards.

#### Row Level Security
- Users can only read/write their own rows in task_stats
- Users can only read their own row in profiles
- confirmed flag managed directly in Supabase dashboard

---

### Content Management Workflow

#### Adding a new topic
1. Drop image into Cline: "create a new topic for this — verb conjugations for 'estar'"
2. Cline generates tasks + creates JSON file in /src/data/
3. Cline temporarily saves image to /src/data/images/
4. Upload script runs → image pushed to Supabase Storage → URL written into JSON
5. Image deleted from /src/data/images/
6. Review, deploy (vite build)

#### Adding tasks to existing topic
1. Drop image into Cline: "add more tasks to topic-verb-falar.json"
2. Cline appends tasks to the file
3. Same image upload flow as above

---

### Non-functional Requirements
- Mobile-first, responsive (desktop works too)
- Static JSON files loaded on demand (only selected topic)
- Supabase calls minimal — only fetch/update stats for current session tasks
- RLS enforced on all Supabase tables
- .env never committed to repo
- vite build → upload to your hosting, no server to maintain

---

## Part 3 — Agent Kickstart Prompt

*Paste this into Cline after completing Part 1 setup steps.*

---

I'm building a personal Portuguese learning web app. Here is the full product spec:

[PASTE PART 2 HERE]

Please scaffold the full project based on this spec. Here's what I need:

## Folder structure to create
```
src/
  components/       # reusable UI components
  views/            # Home, BatchSelection, ModeSelection, Practice, Results, Login, Register, Waiting
  data/             # topic JSON files
  hooks/            # useAuth, useTopics, useSession, useStats
  lib/
    supabase.ts     # Supabase client init from .env
    stats.ts        # read/write task_stats to Supabase
    tolerance.ts    # answer matching (trim, lowercase, diacritics normalised)
    batch.ts        # batching logic (split array into batches of 8-15)
  types/
    index.ts        # Task, Topic, SessionResult, TaskStat, PracticeMode types
```

## What to build in this first session

1. Full TypeScript type definitions in /src/types/index.ts
2. Supabase client in lib/supabase.ts (reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env)
3. Tolerance matching logic in lib/tolerance.ts
4. Batching logic in lib/batch.ts
5. Auth flow: Login view, Register view, Waiting view + useAuth hook
6. Home view: topic cards with name, task count, success rate, image modal, sort toggle
7. Routing wired up for all views (placeholder screens for Practice, Results, BatchSelection, ModeSelection)
8. One example topic JSON file: src/data/topic-telling-time.json with 10 tasks (mix of time expressions in Portuguese)
9. .env.example file with the three keys

## Rules
- TypeScript strict — no `any`
- No localStorage anywhere — Supabase or in-memory only
- Mobile-first Tailwind classes
- Keep components small and focused
- Do not build the image upload script yet — we'll do that separately
