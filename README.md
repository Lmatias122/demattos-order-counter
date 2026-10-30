# DeMattos Order Hub

I want to build a web-based order management system for my snack bar called "DeMattos Lanches".

The system should work as a digital order control system (comanda system) where orders are registered manually in the application. Payments will be handled outside the system for now, but all orders must be saved for tracking and statistics.

The platform must be simple, fast, and optimized for daily food service operations.

Target Users:

- Cashier

- Kitchen staff

- Manager (admin)

Core Features:

1. Orders Page (Main Page)

- Create new order

- Each order must contain:

  - Order number (auto-generated)

  - Customer name (optional)

  - List of selected menu items

  - Quantity per item

  - Notes (e.g., "no onions", "extra cheese")

  - Total price (calculated automatically)

  - Creation timestamp

  - Status of preparation

Order Status Flow:

- Pending

- In Preparation

- Ready

- Delivered

- Cancelled

The status must be visually highlighted with different colors and updated in real time.

2. Menu Management

- Add new menu items

- Edit existing items

- Delete items

- Define:

  - Name

  - Description

  - Price

  - Category (e.g., Burgers, Drinks, Combos)

  - Active/Inactive status

The cashier must be able to select items quickly from the menu when creating an order.

3. User Management

- Role-based authentication system

- User roles:

  - Admin

  - Cashier

  - Kitchen

Admin permissions:

- Manage users

- Manage menu

- View statistics

- View all orders

Cashier permissions:

- Create orders

- Edit orders (before delivered)

- Change order status

Kitchen permissions:

- View orders

- Update order status only

4. Statistics Dashboard

The system must generate daily and monthly statistics:

Daily:

- Total number of orders

- Total revenue

- Most sold item

- Cancelled orders count

Monthly:

- Total revenue

- Total orders

- Best-selling items ranking

- Revenue per category

Charts and visual indicators should be included (bar charts and line charts).

5. Data & Persistence

- All orders must be stored in a database

- Orders cannot be deleted (only cancelled)

- Historical data must be preserved

- Filter orders by date

- Search orders by number or customer name

6. UI/UX Requirements

- Clean and modern interface

- Fast loading

- Optimized for desktop and tablet

- Main dashboard with quick access to:

  - New Order

  - Orders List

  - Statistics

  - Menu Management

- Color-coded status system for quick kitchen visualization

7. Tech Stack Suggestion

Frontend:

- React or Next.js

Backend:

- Node.js or .NET

Database:

- PostgreSQL or MySQL

Authentication:

- JWT-based authentication

The architecture must be scalable and modular, allowing future expansion such as:

- Payment integration

- Online ordering

- WhatsApp integration

- Inventory control

- Financial reports

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e6c21dfe-c9ee-4d83-ab76-d67a295804c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
