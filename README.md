# Meridian Storefront

Responsive e-commerce frontend made with plain HTML, CSS, and JavaScript. No React or frontend framework.

## Run
1. Extract the ZIP.
2. Open `index.html` in a browser, or serve the folder with VS Code Live Server.
3. Without a backend, sample products and local demo cart/order data are shown.

## Connect your MERN backend
Change `API_BASE` at the top of `app.js` (default: `http://localhost:5000/api`).

Expected endpoints:
- `GET /products`
- `POST /products` (admin)
- `PUT /products/:id` (admin)
- `POST /auth/register`
- `POST /auth/login`
- `POST /orders`

The frontend sends a JWT as `Authorization: Bearer <token>`. Product image upload uses multipart form data with the field `imageFile`. Adapt paths and field names in `app.js` to your Express routes.

## Important
This is a frontend starter, not a complete secure commerce system. Enforce authentication, admin roles, validation, stock checks, and all price calculations on the server. Never trust totals or roles sent by the browser. Use HTTPS in production and do not store payment credentials in local storage.

## Included
Storefront, featured products, search, category filtering, sorting, product details, cart quantity controls, checkout form, login/register forms, order history, and an admin preview for product and order management.
