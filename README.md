# Momentum

Momentum is a full-stack habit tracking application built with a FastAPI backend and a React + Vite frontend. It helps users build consistency through daily habit tracking, streak analytics, category-based organization, calendar insights, profile statistics, streak freezes, and downloadable progress reports.

This project includes:
- User authentication with JWT access and refresh tokens
- Habit creation, editing, deletion, and filtering
- Daily habit logging with `completed`, `skipped`, and `missed` states
- Streak tracking with freeze-save support
- Dashboard charts, progress bars, and monthly calendar views
- Profile analytics and CSV report export
- Custom `Momentum` branding and responsive UI

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT authentication with `python-jose`
- Password hashing with `passlib`
- Pandas, NumPy, and Matplotlib for analytics/report utilities

### Frontend
- React
- Vite
- React Router
- Axios
- React Toastify
- Custom CSS

## Project Structure

```text
Habit Tracker/
|-- app/
|   |-- main.py
|   |-- config.py
|   |-- database.py
|   |-- database_sync.py
|   |-- models/
|   |-- routes/
|   |-- schemas/
|   |-- services/
|   `-- utils/
|-- FrontEnd-HabitTracker/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- pages/
|   |   `-- styles/
|   |-- .env
|   `-- package.json
|-- .env
|-- .gitignore
|-- requirements.txt
`-- README.md
```

## Main Features

### 1. Authentication
- User registration
- User login
- Authenticated user lookup with `/auth/me`
- Refresh token support
- Logout support

Authentication uses JWT-based access control. Protected backend routes require a valid bearer token.

### 2. Habit Management
- Create a habit
- Edit habit title, description, category, and freeze count
- Delete a habit
- View all habits for the logged-in user

Each habit belongs to a specific user and includes:
- `title`
- `description`
- `category`
- `freeze_count`
- `created_at`

### 3. Habit Log States
Each habit can be logged once per day with one of these statuses:
- `completed`
- `skipped`
- `missed`

This gives the project more realistic behavior than a simple yes/no completion system.

### 4. Streak Freeze Support
- Every habit can store a number of available freeze saves
- If a habit is marked `missed` and freeze saves are available, a freeze is consumed
- Freeze usage is reflected in analytics and profile stats

This feature allows users to preserve habit momentum in a more forgiving way.

### 5. Dashboard Analytics
The dashboard includes:
- Total habits
- Completed today
- Best streak
- Freeze saves left
- Weekly completion chart
- Average weekly progress
- Habit-level weekly progress bars
- Search, sort, and filtering
- Category filtering
- Monthly calendar view

### 6. Profile Statistics
The profile page includes:
- Total habits
- Best streak
- Active streak count
- Completed, missed, and skipped logs
- Freeze saves used and remaining
- Category breakdown
- Top streak habits
- Recent activity timeline

### 7. Export Report
Users can export a CSV report containing:
- Overall progress summary
- Completed, missed, and skipped totals
- Best streak
- Freeze usage
- Per-habit performance metrics

### 8. Branding and UI
- Custom `Momentum` name and logo
- Responsive layout for desktop and mobile
- Warm modern visual styling
- Hover states, motion, and polished cards
- Light/dark theme toggle stored in local storage

## Backend Architecture

### `app/main.py`
Application entry point.

Responsibilities:
- Creates the FastAPI app
- Initializes the database
- Runs lightweight schema synchronization
- Adds CORS middleware
- Includes all route modules

### `app/config.py`
Loads environment variables from the root `.env` file and exposes config values such as:
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `CORS_ORIGINS`

### `app/database.py`
Creates:
- SQLAlchemy engine
- Session factory
- declarative base

### `app/database_sync.py`
Adds missing columns to existing tables at startup without requiring a full migration workflow.

This currently helps keep older databases compatible with newer fields like:
- `category`
- `freeze_count`
- `status`
- `used_freeze`

### Models

#### `app/models/user.py`
Represents a user account.

#### `app/models/habit.py`
Represents a habit and stores:
- title
- description
- category
- freeze count
- owner relationship

#### `app/models/log.py`
Represents a daily habit log and stores:
- completion boolean
- log status
- freeze usage
- date

#### `app/models/refresh_token.py`
Stores refresh token data for auth flows.

### Schemas

#### `app/schemas/user.py`
Validation models for register/login/auth responses.

#### `app/schemas/habit.py`
Validation models for creating and returning habits.

#### `app/schemas/log.py`
Validation models for creating and returning logs.

### Routes

#### `app/routes/auth.py`
Handles:
- register
- login
- get current user
- refresh token
- logout

#### `app/routes/habits.py`
Handles:
- create habit
- list habits
- get single habit
- update habit
- delete habit

#### `app/routes/logs.py`
Handles:
- add today’s log for a habit
- get logs for a habit

#### `app/routes/analytics.py`
Handles:
- streak analytics
- habit stats
- chart generation
- profile summary
- report export

### Services

#### `app/services/streak_service.py`
Calculates:
- current streak
- longest streak

It also understands skipped days and freeze-protected misses.

#### `app/services/analytics_service.py`
Computes summary stats such as:
- total logs
- completed days
- missed days
- skipped days
- freeze days
- completion rate

#### `app/services/report_service.py`
Generates:
- chart files
- CSV progress report content

### Utilities

#### `app/utils/security.py`
Provides:
- password hashing
- password verification
- access token creation
- refresh token creation
- authenticated user resolution

## Frontend Architecture

### `src/App.jsx`
Defines the main routes:
- `/` → Login
- `/register` → Register
- `/dashboard` → Dashboard
- `/profile` → Profile

### `src/api/api.js`
Central Axios instance.

Responsibilities:
- reads `VITE_API_BASE_URL`
- attaches JWT access token automatically

### `src/components/Navbar.jsx`
Top navigation component with:
- Momentum logo
- Dashboard link
- Profile link
- theme toggle
- logout

### Pages

#### `src/pages/Login.jsx`
Handles user sign-in.

#### `src/pages/Register.jsx`
Handles new user registration.

#### `src/pages/Dashboard.jsx`
The main application screen.

Responsibilities:
- load current user and habits
- display habit cards
- display dashboard summary stats
- create habits
- edit/delete habits
- log daily status
- filter and sort habits
- export reports
- display calendar and 7-day chart

#### `src/pages/Profile.jsx`
Displays higher-level user analytics and recent activity.

### Styling

#### `src/styles/dashboard.css`
Contains the main shared design system for:
- navbar
- cards
- buttons
- dashboard layout
- auth screens
- responsive behavior
- brand styling

## Environment Variables

### Root `.env`
Used by the FastAPI backend.

```env
DATABASE_URL=postgresql://postgres:7006@localhost/HabitTracker_DB
SECRET_KEY=mysecretkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
```

### Frontend `.env`
Used by Vite.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Setup Instructions

### 1. Clone or open the project
Make sure you are inside the project root.

### 2. Create and activate a Python virtual environment

```powershell
python -m venv myvenv
.\myvenv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

```powershell
pip install -r requirements.txt
```

### 4. Configure PostgreSQL
Create a PostgreSQL database that matches the `DATABASE_URL` in `.env`.

Example:
- database name: `HabitTracker_DB`
- user: `postgres`
- password: `7006`

You can change these values in `.env` if needed.

### 5. Start the backend server

```powershell
uvicorn app.main:app --reload
```

Backend default:
- `http://127.0.0.1:8000`

### 6. Install frontend dependencies

```powershell
cd FrontEnd-HabitTracker
npm install
```

### 7. Start the frontend

```powershell
npm run dev
```

Frontend default:
- `http://localhost:5173`

## API Overview

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`

### Habits
- `POST /habits/`
- `GET /habits/`
- `GET /habits/{habit_id}`
- `PUT /habits/{habit_id}`
- `DELETE /habits/{habit_id}`

### Logs
- `POST /logs/{habit_id}`
- `GET /logs/{habit_id}`

### Analytics
- `GET /analytics/streak/{habit_id}`
- `GET /analytics/stats/{habit_id}`
- `GET /analytics/chart/{habit_id}`
- `GET /analytics/profile`
- `GET /analytics/report`

## Current Behavior Notes

- Only one log is allowed per habit per day.
- Theme preference is saved in local storage.
- Export downloads a CSV file named `momentum-report.csv`.
- Backend schema sync adds missing columns automatically on startup.
- The project currently uses a local `.env` loader inside `app/config.py` instead of an external dotenv package.

## Verification

The project has been validated with:
- backend Python syntax parsing
- frontend production build using `npm run build`

## Future Improvement Ideas

- Add Alembic migrations instead of startup schema sync
- Add reminder notifications
- Add richer chart visualizations
- Add test suite for backend routes and frontend pages
- Add deployment instructions
- Add password reset flow
- Add habit notes and custom targets

## Authoring Notes

This README describes the project as it currently exists in the codebase, including:
- the `Momentum` branding
- streak freeze support
- category-based habits
- profile analytics
- CSV export
