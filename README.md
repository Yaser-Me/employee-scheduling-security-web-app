# Employee Scheduling Security Web App

An academic Node.js web application for viewing employee schedules and practicing practical security controls around login, sessions, audit logging, and document uploads.

## What the project demonstrates

- Employee directory and schedule views
- Employee detail editing with server-side validation
- MongoDB persistence
- Username/password login with a simulated email-based second factor
- Database-backed sessions with rolling expiry
- Failed-login tracking, suspicious-activity notification, and account lockout
- Security access logging
- Authenticated PDF document upload and download

## Technology

- Node.js and Express
- Handlebars
- MongoDB
- Multer
- HTML and CSS

## Security controls

- All application routes after the login flow require a valid session.
- Two-factor codes expire after three minutes and are cleared after successful use.
- Sessions expire after five minutes and are refreshed while active.
- A suspicious-activity message is generated after three failed login attempts.
- Accounts are locked after ten failed login attempts.
- Uploaded files are limited to PDF MIME type, 2 MB per file, and five files per employee.
- Uploaded documents are stored outside the public static directory.
- Requests to protected routes are recorded in the `security_log` collection.

## Project structure

| Path | Purpose |
|---|---|
| `app.js` | Express routes, authentication flow, views, and uploads |
| `business.js` | Scheduling and security business rules |
| `persistence.js` | MongoDB access |
| `emailSystem.js` | Console-based email simulation |
| `views/` | Handlebars templates |
| `public/` | Static styles |
| `employee_docs/` | Protected uploaded documents |

## Run locally

Requirements:

- A current Node.js LTS release
- MongoDB running locally or through a test connection string
- Test data in the `infs3201_winter2026` database

Install dependencies:

```bash
npm install
```

Set the MongoDB connection string.

PowerShell:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017"
npm start
```

Bash:

```bash
MONGO_URI="mongodb://127.0.0.1:27017" npm start
```

Open [http://localhost:8000](http://localhost:8000).

The application expects `users`, `employees`, and `shifts` collections. Academic test data is not seeded automatically.

## Important limitations

This is a learning project, not a production-ready identity system. The email service prints messages to the terminal, and the current password hashing is a basic SHA-256 demonstration. A production version should use Argon2 or bcrypt, secure cookie settings, CSRF protection, secrets management, stronger upload validation, and a real email provider.
