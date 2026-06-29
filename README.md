# Demo Credit

Demo Credit wallet service built with Node.js, TypeScript, Express, Knex, and MySQL.

This project is currently an in-progress implementation of a basic wallet system. The foundation, database schema, health endpoint, signup flow, Karma blacklist check, and wallet creation during onboarding have been implemented.

## Tech Stack

- Node.js
- TypeScript
- Express 5
- MySQL
- Knex
- Zod

## Current Features

- Health check endpoint
- User signup endpoint
- User signin endpoint
- Authenticated wallet funding endpoint
- Authenticated wallet transfer endpoint
- Authenticated wallet withdrawal endpoint
- Authenticated transaction history endpoint
- Faux token generation during signup
- Lendsqr Adjutor Karma blacklist check before onboarding
- User and wallet creation in a single database transaction
- TypeScript Knex configuration and migrations
- Centralized error response middleware
- Reusable success response helper
- Zod request validation
- OpenAPI documentation with Swagger UI
- Path aliases with `@/*`


## Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Update `.env` with your MySQL and Adjutor values.

## Environment Variables

```env
PORT=5000
HOST=127.0.0.1
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lendsqr
DB_POOL_MIN=2
DB_POOL_MAX=10

ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
ADJUTOR_API_KEY=
```

`ADJUTOR_API_KEY` is required for signup because the API must reject users found on the Karma blacklist.

## Scripts

```bash
npm run dev
npm run build
npm start
```

Database scripts:

```bash
npm run db:migrate
npm run db:rollback
npm run db:make -- migration_name
npm run db:seed
npm run db:seed:make -- seed_name
```

Knex uses `knexfile.ts`, and migrations are TypeScript files under `src/database/migrations`.

## API Documentation

After starting the development server, open the Swagger UI:

```txt
http://localhost:5000/docs
```

The raw OpenAPI document is also available at:

```txt
http://localhost:5000/docs.json
```

The source OpenAPI file lives at `docs/openapi.yaml`.

## API Endpoints

Full request and response schemas are documented in Swagger. This README keeps only the quick endpoint map:

- `GET /health`
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /wallets/fund`
- `POST /wallets/transfer`
- `POST /wallets/withdraw`
- `GET /transactions?page=1&limit=20`

Wallet mutation endpoints and transaction history require:

```http
Authorization: Bearer demo_generated_auth_token
```

Wallet amounts are sent as integer minor units. For NGN, that means kobo.

## Database Design

![Demo Credit database design](docs/images/demo-credit.png)

Current tables:

- `users`
- `wallets`
- `wallet_transactions`
- `karma_checks`

Relationships:


Money is stored as integer minor units. For NGN, that means kobo:

```txt
NGN 1,000 = 100000 kobo
```

## Signup Flow

```txt
1. Validate request body with Zod.
2. Check for existing user by email, phone number, or BVN.
3. Check the BVN against Lendsqr Adjutor Karma.
4. Reject blacklisted users.
5. Hash password.
6. Start a database transaction.
7. Create user.
8. Create wallet with balance 0.
9. Store Karma check audit record.
10. Commit transaction.
```

If any transactional step fails, the user and wallet creation are rolled back together.

## Faux Authentication

Signup generates a random faux auth token and stores it on the user record.

Protected endpoints should receive the token through the `Authorization` header:

```http
Authorization: Bearer demo_generated_auth_token
```

The auth middleware validates the token, loads the authenticated user, and attaches the user to the Express request. Protected endpoints should use the authenticated request user instead of accepting `user_id` from request bodies.

## Security Notes

- Request validation is handled with Zod.
- Passwords are hashed with Node.js `crypto.scrypt`.
- Sensitive values are not returned in signup responses.
- `.env` is ignored by Git.
- Centralized error middleware avoids leaking raw errors to API clients.
- Signup fails closed when the Adjutor API key is not configured.
- Faux auth tokens are stored for assessment simplicity. In production, this should be replaced with short-lived tokens, refresh tokens, expiry, and revocation.
