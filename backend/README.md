# E-commerce Backend

An Express.js and PostgreSQL API for product management. It supports product
listing and creation, category listing, user registration, and sign-in.

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

The API listens on `http://localhost:3000`.

## Routes

- `GET /products?limit=&cursor=`
- `GET /products/:productId`
- `POST /products`
- `GET /categories`
- `GET /users/:userId`
- `POST /users/registration`
- `POST /users/signin`

See [ARCHITECTURE.md](ARCHITECTURE.md) for design details and current
assumptions.
