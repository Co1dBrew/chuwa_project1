# E-commerce Backend

An Express.js and PostgreSQL API for product, user, cart, and image management.

## Requirements

- Node.js
- PostgreSQL
- `DATABASE_URL`, `JWT_SECRET`, and `REFRESH_JWT_SECRET` environment variables

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce
JWT_SECRET=replace-with-a-long-random-secret
REFRESH_JWT_SECRET=replace-with-a-different-long-random-secret
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

- `GET /products?search=&category_id=&page=&pageSize=`
- `GET /products/:productId`
- `POST /products` — merchant only; optional multipart `image` field
- `DELETE /products/:productId` — merchant owner only
- `GET /categories`
- `GET /media/:scope/:filename` — public local image file
- `GET /users/me` (requires `Authorization: Bearer <accessToken>`)
- `PATCH /users/me/password` — verifies the current password and updates it
- `POST /users/me/avatar` — multipart field `image`; requires auth
- `POST /products/:productId/image` — merchant owner only; multipart field `image`
- `GET /cart-items` — customer only
- `POST /cart-items` — customer only; add `{ product_id, quantity }`
- `PATCH /cart-items/:productId` — customer only; set `{ quantity }`
- `POST /cart-items/:productId/increment` — customer only; increase by one
- `POST /cart-items/:productId/decrement` — customer only; decrease by one
- `DELETE /cart-items/:productId` — customer only; remove an item
- `GET /users/:userId`
- `POST /users/registration` — include `role`: `customer` or `merchant`
- `POST /users/signin`
- `POST /users/refresh` — reads the HttpOnly refresh-token cookie and returns a new access token
- `POST /users/logout` — clears this browser's refresh-token cookie

`GET /cart-items` uses the signed-in user's ID from the access token; it does
not accept a user ID in the URL. All cart-item mutation routes are protected in
the same way.

`POST /products` accepts JSON when no image is needed, or
`multipart/form-data` when an image is included. Form fields are strings, so
send numeric values as text and stringify the optional `meta` object:

```ts
const form = new FormData();
form.append("name", "Wireless Keyboard");
form.append("sku", "KEYBOARD-001");
form.append("category_id", String(1));
form.append("price_amount", String(5999));
form.append("meta", JSON.stringify({ brand: "Acme" }));
form.append("image", imageFile);
```

Image uploads accept one `image` field. JPEG, PNG, and WebP files up to 5 MB
are supported. Product creation and image replacement require a merchant; a
merchant may replace only images for products they own.

Deleting a product also removes its cart items through the database foreign-key
cascade. A later cart-retention feature may keep a removed-item record or
snapshot so customers can see why an item disappeared.

See [ARCHITECTURE.md](ARCHITECTURE.md) for design details and current
assumptions.
