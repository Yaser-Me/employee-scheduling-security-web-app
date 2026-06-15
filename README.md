# Employee Scheduling Security Web App

This project is about employee scheduling system. It was refactored into a Node.js and Express web application using MongoDB, Handlebars, authentication, sessions, 2FA, security logging, and protected PDF uploads.

## Main Features

- Employee scheduling web application
- Node.js and Express backend
- Handlebars views
- MongoDB persistence layer
- User login system
- Session-based access control
- Email-based 2FA simulation
- Account lockout after repeated failed login attempts
- Suspicious activity notification simulation
- Protected employee PDF document uploads

## Security Features

- Routes protected by authentication middleware
- 2FA code generated after successful username/password login
- 2FA code expires after a limited time
- Suspicious activity message after 3 failed login attempts
- Account lockout after 10 failed login attempts
- Uploaded documents are not served through a public static route
- PDF-only upload restriction
- Maximum upload size: 2MB
- Maximum documents per employee: 5

## Test Users

These accounts are for demo/testing only:

```text
username: user1
password: pass123

username: user2
password: hello123
```

## Development Notes

- The 2FA code is printed in the terminal because this is a demo email system.
- Suspicious activity and account lockout messages are also printed in the terminal.
- If a demo account is locked, it can be reset in the `users` collection by changing `locked` to `false` and `failedLogins` to `0`.
- Uploaded employee documents are stored in `employee_docs/`.
- This project is for academic learning and is not production-ready.

## Setup

Install dependencies:

```bash
npm install
```

Run the application:

```bash
node app.js
```

or:

```bash
npm start
```

