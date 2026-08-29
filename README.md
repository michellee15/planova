# Planova

Planova is a collaborative trip-planning application with itinerary planning,
expense splitting, settlements, invitations, and an AI travel assistant.

The project contains:

- `frontend/` — React and Vite
- `backend/` — Node.js, Express, and PostgreSQL

## Prerequisites

Install the following before starting:

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL, including the `psql` and `createdb` command-line tools

## Local setup

### 1. Install dependencies

From the repository root:

```bash
cd backend
npm ci

cd ../frontend
npm ci
```

### 2. Create a PostgreSQL database

Create a local database named `planova`:

```bash
createdb planova
```

If your PostgreSQL role cannot create databases, create it through your usual
PostgreSQL administrator or run:

```bash
psql -U postgres -c "CREATE DATABASE planova;"
```

### 3. Configure the backend environment

Create the backend environment file from the provided template:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your local values:

```dotenv
DB_USER=postgres
DB_HOST=localhost
DB_NAME=planova
DB_PASSWORD=your_postgres_password
DB_PORT=5432

JWT_SECRET=replace_with_a_long_random_secret
PORT=5001
REQUIRE_EMAIL_VERIFICATION=false

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
OVERPASS_BASE_URL=https://overpass-api.de/api/interpreter

MAILJET_API_KEY=
MAILJET_SECRET_KEY=
MAILJET_SENDER_EMAIL=
FRONTEND_URL=http://localhost:5173
```

You can generate a JWT secret with:

```bash
openssl rand -hex 32
```

The database settings and `JWT_SECRET` are required. Keep
`REQUIRE_EMAIL_VERIFICATION=false` for local development without an email
provider; new accounts are verified immediately. In production, set it to
`true` and configure Mailjet credentials with a verified sender address. A
Gemini API key is required only for the AI assistant. The Gemini and Overpass
base URLs normally do not need to be changed.

Create `frontend/.env` from its template so every frontend API module uses the
same backend URL:

```bash
cd ../frontend
cp .env.example .env
```

The local configuration uses port `5001` because macOS may reserve port `5000`
for AirPlay Receiver. If you choose another port, update both `backend/.env` and
`frontend/.env`.

### 4. Run the database migrations

Run the migration script from `backend/`:

```bash
npm run migrate
```

The script reads `backend/.env`, then applies every `.sql` file in
`backend/db/migrations/` in filename order. A successful run prints one
`Applied migration:` line per file.

### 5. Start the application

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

The API will be available at <http://localhost:5001>. Opening that URL should
display `Planova API is running`.

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>.

## Useful commands

Run these commands from the relevant directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend/` | `npm run dev` | Start the API with automatic reload |
| `backend/` | `npm start` | Start the API without automatic reload |
| `backend/` | `npm run migrate` | Apply the PostgreSQL migrations |
| `backend/` | `npm test` | Run backend tests |
| `frontend/` | `npm run dev` | Start the Vite development server |
| `frontend/` | `npm run build` | Create a production frontend build |
| `frontend/` | `npm run lint` | Run the frontend linter |

## Troubleshooting

- `relation "..." does not exist` during migration: pull the latest changes and
  confirm that `backend/db/migrations/000_initial_schema.sql` is present.
- `password authentication failed`: check `DB_USER`, `DB_PASSWORD`, and your
  PostgreSQL authentication configuration.
- `ECONNREFUSED` on port 5432: make sure PostgreSQL is running and `DB_HOST` and
  `DB_PORT` match your installation.
- Registration returns `VERIFICATION_EMAIL_FAILED`: configure the three Mailjet
  variables and verify `MAILJET_SENDER_EMAIL` in Mailjet.
- The AI assistant reports missing configuration: add a valid
  `GEMINI_API_KEY` to `backend/.env` and restart the backend.
