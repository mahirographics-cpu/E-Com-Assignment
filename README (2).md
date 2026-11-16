# Meridian – E-Commerce Platform

Meridian is a full-stack e-commerce web application developed for a small retail business. Customers can browse and search products, add items to their shopping bag, place orders, and view their order history. Store owners can access a protected administration dashboard to manage products and customer orders.

## Live Application

| Service | Link |
|---|---|
| Frontend | https://e-com-assignment-frontend.vercel.app |
| Backend API | https://e-com-assignment-8ozl.onrender.com/ |
| GitHub Repository | https://github.com/mahirographics-cpu/E-Com-Assignment |

**Note:** The backend is hosted on Render's free plan. After a period of inactivity, the first request may take up to a minute while the server starts.

## Team Members

- Mahir Ahmed
- Betsega Teshome

## Features

### Customer Features

- User registration and login
- Browse products and view product details
- Search products by name
- Filter products by category
- Sort products by price or name
- Shopping bag with quantity controls
- Shopping bag data saved in local storage
- Checkout and order placement
- Automatic stock updates after an order is placed
- View personal order history

### Admin Features

- Separate staff sign-in page, accessible through the Store Management link in the footer
- Protected administration dashboard
- Create, update, and delete products
- Upload product images or provide an image URL
- View all customer orders
- Update order status: Pending, Processing, Shipped, Delivered, or Cancelled

Only accounts with the `admin` role can access the administration dashboard and protected admin routes.

### Security and Data Handling

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control for administrative routes
- Customer accounts cannot access admin-only endpoints
- Admin accounts are created through the seed script rather than public registration
- Product prices and order totals are calculated and validated on the server
- Sensitive configuration values are stored in environment variables
- Environment files are excluded from version control

### Additional Features

- Product API pagination using `page` and `limit`
- JSON response for unknown API routes
- Atomic stock updates to prevent the same remaining item from being sold more than once

## Technologies Used

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| Image Uploads | Multer |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Project Structure

```text
E-Com-Assignment/
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
└── backend/
    ├── server.js
    ├── seed.js
    ├── config/
    ├── models/
    │   ├── User
    │   ├── Product
    │   └── Order
    ├── middleware/
    └── routes/
        ├── auth
        ├── products
        └── orders
```

## Running the Project Locally

### Requirements

- Node.js and npm
- MongoDB Atlas account or a MongoDB database
- Visual Studio Code with Live Server for the frontend

### Backend Setup

Open a terminal in the project directory and run:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory with the following configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500
BASE_URL=http://localhost:5000
ADMIN_NAME=Store Owner
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

Create the admin account and sample products, then start the backend server:

```bash
npm run seed
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### Frontend Setup

Configure the `API_BASE` value at the beginning of `frontend/app.js` to point to the backend API:

```javascript
const API_BASE = "http://localhost:5000/api";
```

Open `frontend/index.html` using Visual Studio Code Live Server.

## Deployment

### Database – MongoDB Atlas

The application uses MongoDB Atlas for database hosting. The database connection string is configured through the `MONGODB_URI` environment variable.

### Backend – Render

The backend is deployed on Render:

https://e-com-assignment-8ozl.onrender.com/

Deployment configuration:

- Build command: `npm install`
- Start command: `npm start`

The environment variables listed in the backend setup section must be configured in the Render Environment settings. For the deployed application, `CLIENT_URL` should contain the Vercel frontend URL.

### Frontend – Vercel

The frontend is deployed on Vercel:

https://e-com-assignment-frontend.vercel.app

The frontend API configuration points to the deployed Render backend, with `/api` appended to the backend URL.

### Admin Account

The admin account is created by running the seed script against the production database:

```bash
npm run seed
```

## API Documentation

Protected routes require the following authorization header:

```http
Authorization: Bearer <token>
```

API errors are returned in JSON format:

```json
{
  "message": "Error message"
}
```

### Authentication Routes

| Method | Endpoint | Access | Request Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `name, email, password` | `{ token, user }` |
| POST | `/api/auth/login` | Public | `email, password` | `{ token, user }` |
| GET | `/api/auth/me` | Authenticated | None | `{ user }` |

### Product Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | Returns products. Supports `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, and `limit` query parameters. |
| GET | `/api/products/:id` | Public | Returns a single product. |
| POST | `/api/products` | Admin | Creates a product. Accepts `name`, `description`, `price`, `category`, `stock`, and either an image URL or an uploaded file using `imageFile`. |
| PUT | `/api/products/:id` | Admin | Updates a product. Only the fields being changed need to be sent. |
| DELETE | `/api/products/:id` | Admin | Deletes a product and its uploaded image file. |

The `sort` query parameter supports `low`, `high`, and `name`.

### Order Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | Authenticated | Places an order. Requires `name`, `email`, `phone`, `address`, `paymentMethod`, and `items`. |
| GET | `/api/orders/my` | Authenticated | Returns the logged-in customer's orders. |
| GET | `/api/orders` | Admin | Returns all orders with customer names and email addresses. |
| GET | `/api/orders/:id` | Order Owner or Admin | Returns a specific order. |
| PUT | `/api/orders/:id/status` | Admin | Updates an order's status. |

The order request uses the following payment methods:

- `cash`
- `bank`

Each item in the `items` array contains a product ID and quantity:

```json
{
  "product": "product_id",
  "quantity": 2
}
```

Available order statuses:

- `Pending`
- `Processing`
- `Shipped`
- `Delivered`
- `Cancelled`

The server calculates the order total and checks product stock before creating an order. When an order is cancelled, its items are returned to stock.

## User Roles

| Role | Permissions |
|---|---|
| Customer | Register, log in, browse and search products, place orders, and view personal orders. |
| Admin | All customer permissions, plus manage products, view all orders, and update order statuses. |
