# Budgeting App - Setup and Run Instructions

A full-stack budgeting application built with Node.js/Express backend and React frontend. This application helps track income and expenses with category-based budgeting, analytics, and data export features.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 14.x or higher)
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm** (usually comes with Node.js)
  - Check version: `npm --version`

- **Git** (for cloning the repository)
  - Check version: `git --version`

---

## Technology Stack

### Frontend
- React 19.2.0
- Vite 7.1.9 (build tool and dev server)
- Tailwind CSS 4.1.14
- shadcn/ui components
- Lucide React (icons)
- Chart.js 4.5.1 (data visualization)

### Backend
- Node.js with ES Modules
- Express 5.1.0
- SQLite3 5.1.7 (file-based database)
- CORS 2.8.5

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Kirito1432/Budgeting-App.git
cd Budgeting-App
```

### 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install both frontend and backend dependencies defined in `package.json`.

---

## Database Setup

The application uses **SQLite**, a file-based database that requires no separate installation.

### Database Initialization

The database file `budget.db` is located in the `back_end/` directory. If it doesn't exist, you can initialize it using the schema file:

```bash
cd back_end
sqlite3 budget.db < schema.sql
cd ..
```

### Database Schema

The database includes two main tables:

**1. categories**
- `id`: Primary key
- `name`: Category name (unique)
- `budget_limit`: Budget limit for the category
- `created_at`: Timestamp

**2. transactions**
- `id`: Primary key
- `description`: Transaction description
- `amount`: Transaction amount
- `category_id`: Foreign key to categories table
- `transaction_type`: Either 'income' or 'expense'
- `date`: Transaction date

### Pre-seeded Categories

The database comes with the following default categories:
- Food (Budget: $500)
- Transportation (Budget: $200)
- Entertainment (Budget: $150)
- Utilities (Budget: $300)
- Income (Budget: $0)

---

## Running the Application

You have two options for running the application:

### Option 1: Development Mode (Recommended for Development)

Development mode runs the frontend and backend separately with hot-reloading.

**Step 1: Start the Backend Server**

Open a terminal and run:

```bash
npm start
```

This starts the Express server on **http://localhost:3000**

**Step 2: Start the Frontend Dev Server**

Open a **new terminal** and run:

```bash
npm run dev
```

This starts the Vite development server on **http://localhost:5173**

**Step 3: Access the Application**

Open your browser and navigate to:
```
http://localhost:5173
```

The Vite dev server will automatically proxy API requests to the backend server running on port 3000.

**Benefits of Development Mode:**
- Hot module replacement (instant updates when you edit code)
- React Fast Refresh
- Better debugging
- Source maps for easier troubleshooting

---

### Option 2: Production Mode

Production mode builds the frontend and serves everything from the backend server.

**Step 1: Build the Frontend**

```bash
npm run build
```

This compiles the React application and outputs static files to the `front_end/` directory.

**Step 2: Start the Backend Server**

```bash
npm start
```

**Step 3: Access the Application**

Open your browser and navigate to:
```
http://localhost:3000
```

The Express server serves both the API endpoints and the built React frontend.

---

## Project Structure

```
Budgeting-App/
├── back_end/                    # Backend server
│   ├── server.js               # Main Express server (entry point)
│   ├── db.js                   # SQLite database connection
│   ├── schema.sql              # Database schema and seed data
│   └── budget.db               # SQLite database file
│
├── client/                      # React source code (development)
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── main.jsx            # React app bootstrap
│       ├── App.jsx             # Root component
│       ├── index.css           # Global styles
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   │   ├── button.jsx
│       │   │   ├── card.jsx
│       │   │   ├── input.jsx
│       │   │   ├── select.jsx
│       │   │   └── badge.jsx
│       │   ├── Dashboard.jsx    # Main dashboard view
│       │   ├── Transactions.jsx # Transactions management
│       │   ├── BudgetOverview.jsx # Budget summary
│       │   └── Charts.jsx       # Analytics charts
│       └── lib/
│           └── utils.js        # Utility functions
│
├── front_end/                   # Built/compiled frontend (production)
│   ├── index.html
│   └── assets/                 # Compiled JS/CSS bundles
│
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── .gitignore
└── README.md
```

---

## API Endpoints

The backend provides the following REST API endpoints:

### Transactions

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/transactions` | Get all transactions | - |
| POST | `/api/transactions` | Create new transaction | `{ description, amount, category_id, transaction_type }` |
| DELETE | `/api/transactions/:id` | Delete a transaction | - |
| DELETE | `/api/clear-database` | Delete all transactions | - |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |

### Budget Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budget-summary` | Get budget summary with spending for each category |

### Charts/Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charts/expense-breakdown` | Get expense totals by category |
| GET | `/api/charts/monthly-trend` | Get monthly income/expense trends (last 12 months) |
| GET | `/api/charts/income-expense` | Get total income vs total expenses |

### Data Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/csv` | Export all transactions as CSV file |

---

## Features

### 1. Dashboard
- Overview of recent transactions
- Quick stats on income and expenses
- Budget status indicators

### 2. Transaction Management
- Add new income or expense transactions
- Assign transactions to categories
- Delete individual transactions
- View transaction history

### 3. Category-Based Budgeting
- Pre-defined budget categories
- Set budget limits for each category
- Track spending against limits
- Visual indicators for budget status

### 4. Budget Summary
- See remaining budget for each category
- Percentage of budget used
- Total income and expenses breakdown

### 5. Analytics & Charts
- Expense breakdown by category (pie chart)
- Monthly income vs expenses trend (line chart)
- Total income vs expenses comparison (bar chart)

### 6. Data Export
- Export transaction data to CSV format
- Download for external analysis or backup

### 7. Database Management
- Clear all transactions (with confirmation)
- Reset database to start fresh

---

## Troubleshooting

### Port Already in Use

If you see an error like `EADDRINUSE: address already in use :::3000`:

**Solution:** Change the port by setting the PORT environment variable:

```bash
# For backend
PORT=3001 npm start

# For Vite dev server, edit vite.config.js
```

### Database Errors

If you encounter database errors:

1. **Check if budget.db exists:**
   ```bash
   ls back_end/budget.db
   ```

2. **Reinitialize the database:**
   ```bash
   cd back_end
   rm budget.db
   sqlite3 budget.db < schema.sql
   cd ..
   ```

3. **Verify database permissions:**
   ```bash
   chmod 644 back_end/budget.db
   ```

### Module Not Found Errors

If you see "Cannot find module" errors:

```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Build Errors

If the build fails:

1. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

### Frontend Not Loading in Production

If the frontend doesn't load when running `npm start`:

1. Make sure you built the frontend first:
   ```bash
   npm run build
   ```

2. Check that the `front_end/` directory exists and contains files

3. Verify the server is serving static files from the correct directory in `back_end/server.js`

### CORS Issues

If you encounter CORS errors in development:

- Make sure both servers are running (backend on 3000, frontend on 5173)
- Check that the proxy is configured correctly in `vite.config.js`
- Verify CORS is enabled in `back_end/server.js`

---

## Environment Variables

The application uses minimal environment configuration:

- `PORT`: Backend server port (default: 3000)

To set custom port:

```bash
# Linux/Mac
export PORT=3001
npm start

# Windows
set PORT=3001
npm start
```

---

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) with hot reload |
| `npm run build` | Build React frontend for production |
| `npm start` | Start Express backend server (port 3000) |
| `npm test` | Run tests (not currently configured) |

---

## Development Workflow

### Making Changes to Frontend

1. Start both servers in development mode
2. Edit files in `client/src/`
3. Changes will hot-reload automatically in the browser
4. Test your changes at http://localhost:5173

### Making Changes to Backend

1. Edit files in `back_end/`
2. Restart the backend server: `npm start`
3. Test API endpoints using browser or tools like Postman

### Preparing for Deployment

1. Build the frontend: `npm run build`
2. Test production build: `npm start` and visit http://localhost:3000
3. Ensure all features work correctly
4. Commit changes to git

---

## Additional Resources

- **React Documentation:** https://react.dev/
- **Vite Documentation:** https://vite.dev/
- **Express Documentation:** https://expressjs.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui Components:** https://ui.shadcn.com/
- **Chart.js:** https://www.chartjs.org/

---

## License

ISC

## Repository

https://github.com/Kirito1432/Budgeting-App

---

## Support

For issues or questions, please open an issue on the GitHub repository:
https://github.com/Kirito1432/Budgeting-App/issues
