# Security Assessment & API Review Report

## API Endpoint Security

The API separates public and protected routes. Signup, signin, health check, and API documentation are public. Wallet mutation endpoints and transaction history are protected with bearer-token authentication.

Protected endpoints require an `Authorization: Bearer <token>` header. The auth middleware validates the token against the stored user record, loads the authenticated user, and attaches that user to the Express request. This prevents clients from passing arbitrary `user_id` values in request bodies to access or mutate another user's wallet.

The application also uses Helmet to apply common HTTP security headers and centralized Express error middleware to avoid leaking raw implementation errors to clients.

## Authentication and Authorization

This project uses a faux token-based authentication system. During signup, the service generates an auth token and stores it on the user record. During signin, the password is verified and a new auth token is generated and persisted.

Authorization is scoped around the authenticated user. Wallet funding, withdrawal, transfer, and transaction-history endpoints use the user attached by the auth middleware. This keeps wallet access tied to the authenticated account instead of trusting request-supplied ownership data.

## Vulnerabilities Considered and Mitigations

- Unauthorized wallet access: protected wallet endpoints use the authenticated request user instead of accepting `user_id` from the client.
- Duplicate users: signup checks unique identity fields such as email, phone number, and BVN before creating an account, and the database also enforces uniqueness for those fields.
- Blacklisted users: signup checks the Lendsqr Adjutor Karma service before creating the user and wallet.
- Password exposure: passwords are hashed before storage and are never returned in successful responses.
- Invalid transaction amounts: Zod rejects non-integer, zero, and negative wallet amounts before business logic runs.
- Floating point money errors: monetary values are stored in the lowest currency unit, such as kobo, to avoid JavaScript floating point precision issues.
- Partial wallet updates: wallet mutations and ledger records are wrapped in transactions so balance updates and transaction entries succeed or fail together.
- Concurrent balance updates: wallet rows are locked during fund, withdraw, and transfer operations, and balance checks happen after the wallet row is locked.
- Self-transfer abuse: transfers to the same wallet are rejected to prevent unnecessary or misleading wallet transactions.
- Orphaned users or wallets: user creation and wallet creation are wrapped in a database transaction so both records are created together or not at all.
- Duplicate wallets: a database-level unique constraint ensures that each user can only have one wallet.
- Negative stored balances or transaction amounts: database columns use unsigned integer types for wallet balances and transaction amount fields.
- Karma verification bypass during third-party failure: external Karma verification failures fail closed, so users are not created when blacklist verification cannot be completed.
- Leaking internal errors: centralized error handling sanitizes unexpected errors so raw database errors, stack traces, and third-party error details are not returned to API clients.
- Large unbounded transaction responses: transaction history endpoints use pagination to prevent excessive response sizes and reduce the risk of performance abuse.
- Untraceable wallet balance changes: wallet balances are backed by ledger records so every balance mutation has a corresponding transaction entry.

## Input Validation and Backend Protection

Request validation is handled with Zod schemas before controller data reaches the service layer. Invalid request bodies or query parameters are rejected early with structured validation errors.

Passwords are hashed with Node.js `crypto.scrypt` before persistence. Password verification uses the stored hash format and timing-safe comparison. Sensitive fields such as password hashes are not returned in API responses.

Wallet balance changes are performed inside database transactions, and wallet rows are locked during balance-changing operations to reduce race-condition risk.

## Security Improvements in Production

For production, I would replace faux auth tokens with a stronger authentication approach, such as short-lived access tokens with refresh tokens or opaque session tokens with expiry, rotation, revocation, and secrets loaded from environment variables.

I would add rate limiting to sensitive endpoints such as signup, signin, fund, withdraw, and transfer to reduce brute-force attempts, signup abuse, and repeated financial-operation abuse. I would also tighten CORS to allow only trusted frontend origins.

For wallet operations, I would add audit logs that record who performed each balance-changing action, the request context, and the before-and-after state. I would also add idempotency keys for fund, withdraw, and transfer requests to reduce duplicate processing when clients retry failed requests.

For monitoring, I would add structured request logs, correlation IDs, centralized log storage, uptime checks, alerts for repeated failed authentication attempts, alerts for wallet operation failures, and metrics for latency, error rates, failed signups, and database failures.


## Failure Handling and Debugging

### How I Handle Failing Functionalities or Unexpected Errors
Expected business failures are represented with application errors that include HTTP status codes and stable error codes. Examples include invalid credentials, missing auth tokens, insufficient funds, duplicate user details, and missing wallets.

Unexpected errors flow through centralized error middleware, which returns a generic server error response instead of exposing stack traces or raw database errors to API clients.


### How I Detect, Debug, and Trace Issues Within the Backend
To debug issues, I would start from the failing endpoint, reproduce the request with the same payload and headers, then trace the flow through controller validation, service rules, repository calls, and database state. To make tracing easier, I would add logs at important boundaries such as request entry, validation failure, authentication failure, service-level business errors, third-party Karma failures, and database transaction failures. These logs should include safe debugging context such as request ID, endpoint, status code, and error code, but should not include passwords, auth tokens, BVNs, or raw secrets.

Unit tests cover positive and negative paths across services, validation schemas, middleware, and utilities, which helps isolate whether a failure is caused by request validation, authentication, business logic, or persistence behavior.

### My Approach to Logging, Monitoring, and Improving Reliability
For this assessment, reliability is mainly handled through clear errors, transaction scoping, row locking, and unit tests. These choices make failures easier to reproduce and reduce the risk of partially completed wallet operations.

In development, debugging is done by reproducing requests locally, reading the structured API error response, checking the HTTP status and error code, and tracing the request through the controller, service, repository, and database layers. The unit tests also act as a local safety net for confirming whether failures are caused by validation, authentication, wallet logic, or persistence behavior.

For logging and monitoring in a production version, I would add structured request logs, correlation IDs, centralized log storage, uptime checks, error alerts, and metrics for request latency, failed signups, failed authentication attempts, wallet operation failures, and database failures. This would make it easier to trace a request across the API, detect repeated failures early, and respond before users are heavily affected.


### Example of a Possible Failure Scenario and How I Would Diagnose and Fix It
Scenario: a wallet transfer fails after debiting the sender but before crediting the recipient.

To diagnose this, I would check the API response error code, inspect application logs for the request, verify both wallet balances in the database, and check whether linked `transfer_out` and `transfer_in` records were created. If the rollback worked correctly, there should be no partial transfer state.

The implementation mitigates this by running transfer operations inside a database transaction. If any step fails, the transaction rolls back and the sender's balance, recipient's balance, and transaction records are not partially persisted.

