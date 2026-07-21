# E-commerce Backend

An Express.js and PostgreSQL API for product, user, cart, and image management.

## Requirements

- Node.js
- PostgreSQL
- `DATABASE_URL` and `JWT_SECRET` environment variables

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce
JWT_SECRET=replace-with-a-long-random-secret
```

## Run locally

From `backend/`, install dependencies and initialize a fresh database:

```sh
npm install
psql "$DATABASE_URL" -f sql/ddl.sql
```

In PowerShell, use:

```powershell
psql $env:DATABASE_URL -f sql/ddl.sql
```

The source is TypeScript and the package does not currently define a run
script. Start it with a TypeScript runner:

```sh
npx tsx main.ts
```

The API listens on `http://localhost:3000`. Locally uploaded files are stored
in `uploads/` and publicly served from `/media`.

## Routes

- `GET /products?limit=&cursor=`
- `GET /products/:productId`
- `POST /products`
- `GET /categories`
- `GET /media/:scope/:filename` — public local image file
- `GET /users/me` (requires `Authorization: Bearer <accessToken>`)
- `POST /users/me/avatar` — multipart field `image`; requires auth
- `POST /products/:productId/image` — multipart field `image`; requires auth
- `GET /cart-items` (requires `Authorization: Bearer <accessToken>`)
- `POST /cart-items` — add `{ product_id, quantity }`
- `PATCH /cart-items/:productId` — set `{ quantity }`
- `POST /cart-items/:productId/increment` — increase by one
- `POST /cart-items/:productId/decrement` — decrease by one
- `DELETE /cart-items/:productId` — remove an item
- `GET /users/:userId`
- `POST /users/registration`
- `POST /users/signin`

`GET /cart-items` uses the signed-in user's ID from the access token; it does
not accept a user ID in the URL. All cart-item mutation routes are protected in
the same way.

Image upload routes accept one `image` field in `multipart/form-data`. JPEG,
PNG, and WebP files up to 5 MB are supported. Product-image uploads currently
require authentication but do not yet enforce product-management authorization.

See [ARCHITECTURE.md](ARCHITECTURE.md) for design details and current
assumptions.
