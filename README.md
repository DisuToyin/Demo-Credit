# Demo Credit

Demo Credit wallet service built with Node.js, TypeScript, Express, Knex, and MySQL.

This project implements the Demo Credit wallet MVP. It supports user onboarding, Karma blacklist checks, faux token authentication, wallet funding, wallet withdrawals, wallet-to-wallet transfers, and transaction history.

## Tech Stack

- Node.js
- TypeScript
- Express 5
- MySQL
- Knex
- Zod

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
npm test
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

## Testing

Run the unit test suite:

```bash
npm test
```

The tests cover:

- Auth service signup and signin flows
- Wallet funding, withdrawal, and transfer behavior
- Transaction history pagination and response mapping
- Lendsqr Adjutor Karma lookup behavior
- Request validation schemas
- Authentication and error middleware
- Password hashing and verification utilities

Test files live under `tests/` so production source files remain focused on application logic.

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

## Design Decisions

- Wallet mutations run inside database transactions so balance changes and transaction records succeed or fail together.
- Wallet transfers create two linked ledger records: `transfer_out` for the sender and `transfer_in` for the recipient.
- Wallet rows are locked during balance-changing operations to reduce race conditions.
- Signup validates the request with Zod, checks for duplicate identity fields, checks Lendsqr Adjutor Karma, hashes the password, then creates the user, wallet, auth token, and Karma audit record in a controlled flow.
- A faux bearer token is used for assessment scope instead of a full production auth system. Signup generates the token, stores it on the user record, and protected endpoints receive it through the `Authorization` header.
- The auth middleware validates the stored token, loads the authenticated user, and attaches the user to the Express request so protected endpoints do not accept `user_id` from request bodies.
- Controllers only handle HTTP concerns; services contain business rules; repositories handle database access.

## Database Design

![Demo Credit database design](docs/images/demo-credit.png)

Current tables:

- `users`
- `wallets`
- `wallet_transactions`
- `karma_checks`

Relationships:

Each user owns one wallet. Each wallet owns many wallet transaction records. Karma checks optionally reference a user, allowing failed blacklist checks to be recorded before a user exists.

## Security Notes

- Request validation is handled with Zod.
- Passwords are hashed with Node.js `crypto.scrypt`.
- Sensitive values are not returned in signup responses.
- `.env` is ignored by Git.
- Centralized error middleware avoids leaking raw errors to API clients.
- Faux auth tokens are stored for assessment simplicity.
