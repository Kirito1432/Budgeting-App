# Budgeting App - Project Structure

## Overview
This is a full-stack budgeting application built with React (frontend) and Express + SQLite (backend).

## Project Structure

```
Budgeting-App/
├── back_end/              # Backend server and database
│   ├── server.js         # Express server with API endpoints (COMMENTED)
│   ├── db.js             # SQLite database connection
│   └── budget.db         # SQLite database file
│
├── client/               # React source code (COMMENTED)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Dashboard view with financial summary
│   │   │   ├── Transactions.jsx   # Transaction management (add/delete/export/clear)
│   │   │   ├── BudgetOverview.jsx # Budget tracking per category
│   │   │   └── Charts.jsx         # Analytics charts using Chart.js
│   │   ├── App.jsx       # Main app component with navigation
│   │   ├── main.jsx      # React entry point
│   │   └── index.css     # Global styles
│   └── index.html        # HTML template
│
├── front_end/            # Built React app (served by Express in production)
│   ├── assets/           # Compiled JS and CSS bundles
│   └── index.html        # Built HTML file
│
├── vite.config.js        # Vite configuration (COMMENTED)
├── package.json          # Dependencies and scripts
└── README.md            # Project documentation

```

## Features

### Dashboard
- Total income display
- Total expenses display
- Net balance calculation
- Recent transactions (last 5)

### Transactions
- Add new transactions with category and type
- View all transactions
- Delete individual transactions
- **Clear all transactions** (with confirmation)
- Export transactions to CSV

### Budget Overview
- View budget limits by category
- Track spending vs budget
- Visual progress bars
- Over-budget warnings

### Charts & Analytics
1. Expense Breakdown by Category (Doughnut Chart)
2. Budget vs Actual Spending (Bar Chart)
3. Income vs Expenses (Pie Chart)
4. Monthly Spending Trend (Line Chart)

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `DELETE /api/transactions/:id` - Delete a transaction by ID
- `DELETE /api/clear-database` - Delete ALL transactions

### Categories
- `GET /api/categories` - Get all budget categories

### Budget
- `GET /api/budget-summary` - Get budget summary with calculations

### Charts
- `GET /api/charts/expense-breakdown` - Expense data by category
- `GET /api/charts/monthly-trend` - Income/expenses by month (last 12 months)
- `GET /api/charts/income-expense` - Total income vs total expenses

### Export
- `GET /api/export/csv` - Export transactions to CSV file

## Development

### Run in Development Mode (with hot reload):
```bash
# Terminal 1 - Start backend server
npm start

# Terminal 2 - Start React dev server
npm run dev
```
Then open `http://localhost:5173`

### Run in Production Mode (single server):
```bash
# Build the React app
npm run build

# Start the server (serves both frontend and backend)
npm start
```
Then open `http://localhost:3000`

## Technologies Used

### Frontend
- **React 19.2** - UI library
- **Vite 7.1** - Build tool and dev server
- **Chart.js 4.5** - Data visualization

### Backend
- **Express 5.1** - Web server framework
- **SQLite3 5.1** - Database
- **CORS** - Cross-origin resource sharing

## Code Comments

All code files include comprehensive comments explaining:
- Purpose of each component/function
- Parameters and return values
- Key logic and decisions
- API endpoint documentation

Files with detailed comments:
- ✅ `back_end/server.js` - Full API documentation
- ✅ `client/src/App.jsx` - Main app logic
- ✅ `client/src/components/Dashboard.jsx` - Dashboard component
- ✅ `client/src/components/Transactions.jsx` - Transaction management
- ✅ `client/src/components/BudgetOverview.jsx` - Budget display
- ✅ `client/src/components/Charts.jsx` - Chart rendering
- ✅ `client/src/main.jsx` - React entry point
- ✅ `vite.config.js` - Build configuration

## Database Schema

### transactions table
- `id` - Primary key
- `description` - Transaction description
- `amount` - Transaction amount
- `category_id` - Foreign key to categories
- `transaction_type` - 'income' or 'expense'
- `date` - Transaction date (default: current timestamp)

### categories table
- `id` - Primary key
- `name` - Category name
- `budget_limit` - Budget limit for this category
