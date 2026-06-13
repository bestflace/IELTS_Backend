# IELTSBF Backend

IELTSBF Backend is the API server for the IELTSBF learning platform.  
It handles authentication, role-based access, IELTS content management, test attempts, teacher reviews, import jobs, media uploads, notifications, comments, and learner progress data.

The backend is designed for three main roles:

- **Learner**: practice tests, submit answers, view results and feedback.
- **Teacher**: review Writing/Speaking submissions, grade attempts, reply to learner comments.
- **Admin**: manage users, tests, content bank, imports, uploads, reports, and moderation.

## Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT Authentication**
- **BullMQ / Redis** for background jobs
- **Cloudinary / R2** for media uploads
- **AI grading integration** for Writing and Speaking review workflows

## Main Modules

```text
src/
├── common/              # shared constants, helpers, errors, response format
├── config/              # app, database, prisma, redis, upload, AI configs
├── middlewares/         # auth, role guard, validation, error handling
├── modules/
│   ├── auth/            # login, register, refresh token, password recovery
│   ├── user/            # user profile, roles, status
│   ├── test/            # IELTS test management and preview
│   ├── attempt/         # learner attempts, submission, status, result
│   ├── reading/         # reading sets, questions, public/admin APIs
│   ├── listening/       # listening sets, audio, questions
│   ├── writing/         # writing tasks, grading workflow
│   ├── speaking/        # speaking sets, prompt parts, recording workflow
│   ├── teacher-review/  # teacher submission review and scoring
│   ├── import/          # Excel/CSV import jobs
│   ├── upload/          # media upload, file library, Cloudinary/R2
│   ├── notification/    # system/user notifications
│   ├── comment/         # discussion/comments under attempts
│   └── blog/            # learning blog content
├── routes/              # route registration
├── workers/             # background workers
└── server.ts            # application entry
```

Folder names may vary slightly depending on the current branch.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy the example file:

```bash
cp .env.example .env
```

Then update the values for your local database, JWT secrets, Redis, upload provider, and AI provider.

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start development server

```bash
npm run dev
```

Default API base URL:

```text
http://localhost:5000/api/v1
```

## Environment Variables

Create `.env` in the backend root.

```env
# App
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ieltsbf?schema=public

# JWT
JWT_SECRET=replace_with_a_secure_access_token_secret
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=replace_with_a_secure_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis / BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI grading
GEMINI_API_KEY=replace_with_your_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=replace_with_cloud_name
CLOUDINARY_API_KEY=replace_with_api_key
CLOUDINARY_API_SECRET=replace_with_api_secret

# R2 / S3-compatible storage, if used
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=

# Mail, if password recovery email is enabled
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Never commit `.env`. Only commit `.env.example`.

## Available Scripts

Common scripts:

```bash
npm run dev
npm run build
npm start
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

If your `package.json` uses different script names, follow the scripts defined there.

## API Overview

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/verify-code
POST /auth/reset-password
```

### Learner Test Flow

```text
GET    /tests
GET    /tests/:id
POST   /attempts
GET    /attempts
GET    /attempts/:attemptId
PATCH  /attempts/:attemptId
POST   /attempts/:attemptId/submit
GET    /attempts/:attemptId/result
```

### Admin Test Management

```text
GET    /admin/tests
POST   /admin/tests
GET    /admin/tests/:id
PATCH  /admin/tests/:id
DELETE /admin/tests/:id
POST   /admin/tests/:id/publish
POST   /admin/tests/:id/unpublish
PUT    /admin/tests/:id/sections
POST   /admin/tests/:id/sections
PATCH  /admin/test-sections/:sectionId
DELETE /admin/test-sections/:sectionId
```

### Content Bank

```text
GET    /admin/reading-sets
POST   /admin/reading-sets
GET    /admin/reading-sets/:id
PATCH  /admin/reading-sets/:id
POST   /admin/reading-sets/:id/publish
POST   /admin/reading-sets/:id/unpublish

GET    /admin/listening-sets
POST   /admin/listening-sets

GET    /admin/writing-tasks
POST   /admin/writing-tasks

GET    /admin/speaking-sets
POST   /admin/speaking-sets
```

### Teacher Review

```text
GET    /teacher/submissions
GET    /teacher/submissions/:submissionId
POST   /teacher/submissions/:submissionId/claim
POST   /teacher/submissions/:submissionId/release
POST   /teacher/submissions/:submissionId/review
```

### Uploads and Import Jobs

```text
GET    /admin/uploads
POST   /admin/uploads/cloudinary
DELETE /admin/uploads

GET    /admin/imports
POST   /admin/imports
GET    /admin/imports/:jobId
POST   /admin/imports/:jobId/retry
DELETE /admin/imports/:jobId
```

Route names may differ slightly depending on the current implementation.

## Role-Based Access

The backend uses role-based access control.

```text
USER      learner routes and own attempt data
TEACHER   teacher review workspace and assigned submissions
ADMIN     full management access
```

Protected routes require a valid access token in the request header:

```text
Authorization: Bearer <access_token>
```

## Database

The project uses Prisma with PostgreSQL.

Useful commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

When schema changes are made:

```bash
npx prisma migrate dev --name <migration_name>
```

For production:

```bash
npx prisma migrate deploy
```

## Import Worker

The import module supports Excel/CSV-based content import.  
Typical flow:

1. Admin uploads a completed import template.
2. Backend creates an import job.
3. Worker reads the file and validates rows.
4. Valid records are inserted into the content bank.
5. Job status and worker result are saved for admin review.

Make sure Redis and worker processes are running when import jobs are enabled.

## Upload Service

The upload module supports media storage for:

- Listening audio
- Writing images/charts
- Reading images/maps
- Import files
- General media library assets

Uploaded files should be stored in the `uploaded_files` table and exposed through the admin media library.

## Error Handling

The API should return consistent error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

Validation errors should be handled by the validator middleware before reaching service logic.

## Security Notes

Do not commit real secrets:

```text
DATABASE_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
GEMINI_API_KEY
CLOUDINARY_API_SECRET
SMTP_PASSWORD
REDIS_PASSWORD
```

If a real secret is pushed, rotate the secret immediately.

## Git Hygiene

Recommended `.gitignore` entries:

```text
node_modules/
dist/
build/
.env
.env.*
!.env.example
logs/
*.log
uploads/
*.zip
```

## Development Notes

Before opening a pull request or pushing a major change:

```bash
npm run build
npx prisma generate
```

Also test core flows:

- Register/login
- Learner starts and submits an attempt
- Teacher reviews a submission
- Admin creates/publishes a test
- Admin imports content
- Admin uploads media
- Notification and comment flows

## Project Status

This backend is part of the IELTSBF platform and is under active development.
