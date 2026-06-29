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
- Authenticated wallet withdrawal endpoint
- Authenticated transaction history endpoint
- Faux token generation during signup
- Lendsqr Adjutor Karma blacklist check before onboarding
- User and wallet creation in a single database transaction
- TypeScript Knex configuration and migrations
- Centralized error response middleware
- Reusable success response helper
- Zod request validation
- Path aliases with `@/*`

## Project Structure

```txt
src/
  config/
  database/
    migrations/
  middlewares/
  modules/
    health/
    karma/
    transactions/
    wallets/
  routes/
  utils/
  app.ts
  server.ts
```

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

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Signup

```http
POST /auth/signup
```

Request:

```json
{
  "first_name": "Ada",
  "last_name": "Okafor",
  "email": "ada.okafor@example.com",
  "phone_number": "08012345678",
  "bvn": "12345678901",
  "password": "Password123"
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "generated-user-id",
      "first_name": "Ada",
      "last_name": "Okafor",
      "email": "ada.okafor@example.com",
      "phone_number": "08012345678"
    },
    "wallet": {
      "id": "generated-wallet-id",
      "account_number": "1234567890",
      "balance": 0,
      "currency": "NGN"
    },
    "token": "demo_generated_auth_token"
  }
}
```

The response intentionally excludes `password_hash` and `bvn`. The returned `token` is the faux authentication token for protected endpoints.

### Signin

```http
POST /auth/signin
```

Request:

```json
{
  "email": "ada.okafor@example.com",
  "password": "Password123"
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Signin successful.",
  "data": {
    "user": {
      "id": "generated-user-id",
      "first_name": "Ada",
      "last_name": "Okafor",
      "email": "ada.okafor@example.com",
      "phone_number": "08012345678"
    },
    "token": "demo_rotated_auth_token"
  }
}
```

Signin verifies the stored password hash, rotates the faux auth token, and returns the new token.

### Fund Wallet

```http
POST /wallets/fund
Authorization: Bearer demo_generated_auth_token
```

Request:

```json
{
  "amount": 500000,
  "description": "Test wallet funding"
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Wallet funded successfully.",
  "data": {
    "wallet": {
      "id": "generated-wallet-id",
      "account_number": "1234567890",
      "balance": 500000,
      "currency": "NGN"
    },
    "transaction": {
      "id": "generated-transaction-id",
      "type": "fund",
      "amount": 500000,
      "balance_before": 0,
      "balance_after": 500000,
      "reference": "FND_generated-reference",
      "status": "successful",
      "description": "Test wallet funding"
    }
  }
}
```

`amount` is sent in kobo. Funding locks the authenticated user's wallet, updates the wallet balance, and creates a wallet transaction record in one database transaction.

### Withdraw Funds

```http
POST /wallets/withdraw
Authorization: Bearer demo_generated_auth_token
```

Request:

```json
{
  "amount": 200000,
  "description": "Test withdrawal"
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Withdrawal successful.",
  "data": {
    "wallet": {
      "id": "generated-wallet-id",
      "account_number": "1234567890",
      "balance": 300000,
      "currency": "NGN"
    },
    "transaction": {
      "id": "generated-transaction-id",
      "type": "withdrawal",
      "amount": 200000,
      "balance_before": 500000,
      "balance_after": 300000,
      "reference": "WDR_generated-reference",
      "status": "successful",
      "description": "Test withdrawal"
    }
  }
}
```

`amount` is sent in kobo. Withdrawal locks the authenticated user's wallet, checks available balance, updates the wallet balance, and creates a wallet transaction record in one database transaction.

### Get Transactions

```http
GET /transactions?page=1&limit=20
Authorization: Bearer demo_generated_auth_token
```

Successful response:

```json
{
  "status": "success",
  "message": "Transactions retrieved successfully.",
  "data": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "total_pages": 1
    },
    "transactions": [
      {
        "id": "generated-transaction-id",
        "type": "withdrawal",
        "amount": 200000,
        "balance_before": 500000,
        "balance_after": 300000,
        "reference": "WDR_generated-reference",
        "related_transaction_id": null,
        "counterparty_wallet_id": null,
        "status": "successful",
        "description": "Test withdrawal",
        "created_at": "2026-06-29T10:00:00.000Z"
      }
    ]
  }
}
```

Transactions are scoped to the authenticated user's wallet. `page` and `limit` are optional, and `limit` is capped at 100.

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
