
Node.js + Express + MongoDB (Mongoose) REST API for the Meridian e-commerce frontend.


server.js            App entry point (middleware, routes, start)
seed.js              Creates the admin account + sample products
config/db.js         MongoDB connection
models/              User.js, Product.js, Order.js (Order references User)
middleware/          auth.js (JWT + admin check), upload.js (Multer), error.js, asyncHandler.js
routes/              auth.js, products.js, orders.js
uploads/             Uploaded product images (git-ignored)
```

## Run it locally

```bash
npm install
cp .env.example .env      # then edit .env (MongoDB URI + JWT secret)
npm run seed              # creates admin + sample products
npm run dev               # http://localhost:5000
```

Default admin (from `.env`): `admin@meridian.com` / `Admin12345` – change it before deploying.

The frontend already points to `http://localhost:5000/api`. Before deploying, change `API_BASE` at the top of the frontend's `app.js` to your Render URL.



- **Database:** MongoDB Atlas -> copy the connection string into `MONGODB_URI`.
- **Backend (Render):** Build command `npm install`, start command `npm start`. Add all variables from `.env.example` in Render's *Environment* tab. Set `BASE_URL` to your Render URL and `CLIENT_URL` to your Vercel URL.
- **Frontend (Vercel):** deploy the frontend folder.
- **Note:** Render's free disk is wiped on every deploy/restart, so uploaded images can disappear. For permanent images use the "Image URL" field, or move uploads to a service such as Cloudinary.



| Role | Can do |
|------|--------|
| customer (default) | register, log in, browse/search/filter, place orders, view own orders |
| admin | everything above + create/update/delete products, view all orders, change order status |

A customer calling an admin route gets `403 Forbidden`. Nobody can register as admin through the API; use `npm run seed`.


Protected routes need the header `Authorization: Bearer <token>`. All errors look like `{ "message": "..." }`.

### Auth
| Method | Route | Access | Body | Response |
|--------|-------|--------|------|----------|
| POST | `/api/auth/register` | public | `name, email, password` | `{ token, user }` |
| POST | `/api/auth/login` | public | `email, password` | `{ token, user }` |
| GET | `/api/auth/me` | logged in | – | `{ user }` |

### Products
| Method | Route | Access | Notes |
|--------|-------|--------|-------|
| GET | `/api/products` | public | Query: `search` (name), `category`, `minPrice`, `maxPrice`, `sort` (`low`/`high`/`name`), `page`, `limit`. With `page`/`limit` returns `{ products, total, page, pages }`, otherwise an array |
| GET | `/api/products/:id` | public | One product |
| POST | `/api/products` | admin | JSON or multipart: `name, description, price, category, stock` (or `stockQuantity`), `image` (URL) or file field `imageFile` |
| PUT | `/api/products/:id` | admin | Same fields as POST; send only what changes |
| DELETE | `/api/products/:id` | admin | Also deletes the uploaded image file |

### Orders
| Method | Route | Access | Notes |
|--------|-------|--------|-------|
| POST | `/api/orders` | logged in | Body: `name, email, phone, address, paymentMethod ("cash"/"bank"), items: [{ product, quantity }]`. Server calculates the total and **decreases stock automatically** (rejects if stock is too low) |
| GET | `/api/orders/my` | logged in | The user's own orders |
| GET | `/api/orders` | admin | All orders, with customer name/email populated |
| GET | `/api/orders/:id` | owner or admin | One order |
| PUT | `/api/orders/:id/status` | admin | Body: `{ "status": "Pending" \| "Processing" \| "Shipped" \| "Delivered" \| "Cancelled" }`. Cancelling returns items to stock |

## Security notes

- Passwords hashed with bcrypt (`bcryptjs`), never returned by the API.
- JWT secret, DB URI and port live in `.env` (git-ignored).
- Prices, totals and roles are never trusted from the browser.
- Stock is reduced with an atomic MongoDB update, so the last item cannot be sold twice.
- Image uploads: images only, 5 MB max.
