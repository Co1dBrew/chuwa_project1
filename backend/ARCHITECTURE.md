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
    cart_items.router.ts   Authenticated cart operations
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

## Database query types

`db.ts` types represent the exact columns each query accepts or returns. Input
and row types stay separate when PostgreSQL supplies fields or defaults, such
as a product ID or inventory. They are shared when the shapes are identical:
`CartItem` is both the required insert input and the row returned by
`createCartItem`. Join-only shapes, such as a cart item with product details,
remain private to the query that needs them.

## Cart mutations

Cart mutations are scoped to the authenticated user. A cart item is created
with a positive `quantity`; later requests can set, increment, decrement, or
delete it. Increment and decrement each change the quantity by one; only the
set route accepts a quantity value. Decrement requires the remaining quantity
to stay above zero. Removing an item is therefore always an explicit `DELETE`
request.

## Authentication assumptions

Registration hashes passwords with Argon2. Sign-in verifies the password and
returns a short-lived JWT access token. `authenticate` verifies token signature,
issuer, audience, expiry, and a valid integer user ID before protected routes
receive it. `GET /cart-items` uses that ID to retrieve the caller's cart; it
does not query user existence again. Consequently, a token for a deleted user
can return an empty cart until its 15-minute expiry. `GET /cart-items` is
currently the protected route. Authorization for modifying resources is not
implemented yet, so this backend should not be treated as production-ready.

## Design choices

- **Flat structure:** fewer files and clearer navigation at the current size.
  Feature services/repositories can be introduced when business logic grows.
- **Zod at the HTTP boundary:** request data is parsed before it reaches SQL.
- **Parameterized SQL:** queries use placeholders for values.
- **Database invariants:** PostgreSQL remains the final authority for key data
  integrity rules.
- **Central response format:** successful routes return their resource; errors
  consistently return an `error` object with a code and message.
