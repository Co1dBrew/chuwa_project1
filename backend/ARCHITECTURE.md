# Architecture

## Overview

This is a small, feature-oriented Express API with PostgreSQL. It deliberately
uses a flat structure while the application is small:

```text
HTTP request
  → Express middleware
  → router validation and domain decisions
  → db.ts query functions
  → PostgreSQL
```

## File structure

```text
backend/
  main.ts                 Express setup, JSON parsing, routes, shutdown
  error.ts                AppError and final HTTP error responses
  validation.ts           Zod validation → AppError conversion
  auth.ts                 Password hashing and access-token creation
  db.ts                   PostgreSQL pool, queries, database-error helpers
  utils.ts                Environment helper and INTEGER range constant
  routers/
    products.router.ts
    categories.router.ts
    users.router.ts
  sql/ddl.sql             Fresh schema and development seed data
```

## Request validation and errors

Expected client-facing failures become `AppError` at the boundary that
understands them:

- invalid JSON → `400 INVALID_JSON`
- invalid path, query, or body data → `400 VALIDATION_ERROR`
- missing product or user → `404`
- duplicate account or SKU → `409`
- nonexistent product category → `422`

`errorHandler` only formats `AppError`. Unexpected problems, such as a
PostgreSQL outage or a programming error, are logged and returned as a safe
`500 INTERNAL_ERROR` response.

## Data model assumptions

- The schema is for a fresh database; there are no migrations yet.
- IDs and `price_amount` use PostgreSQL `INTEGER`, so they map safely to
  JavaScript `number`.
- `price_amount` is stored in the currency's smallest unit, such as cents.
- Product responses contain `category_id`; clients fetch `/categories` to map
  an ID to a display name.
- Database constraints protect core integrity: keys, uniqueness, foreign keys,
  nonnegative price/inventory, object-shaped metadata, and positive cart
  quantities.

## Authentication assumptions

Registration hashes passwords with Argon2. Sign-in verifies the password and
returns a short-lived JWT access token. Token verification and authorization
middleware are not implemented yet, so write endpoints are not protected and
this backend should not be treated as production-ready.

## Design choices

- **Flat structure:** fewer files and clearer navigation at the current size.
  Feature services/repositories can be introduced when business logic grows.
- **Zod at the HTTP boundary:** request data is parsed before it reaches SQL.
- **Parameterized SQL:** queries use placeholders for values.
- **Database invariants:** PostgreSQL remains the final authority for key data
  integrity rules.
- **Central response format:** successful routes return their resource; errors
  consistently return an `error` object with a code and message.
