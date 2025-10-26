# Implementation Plan - New Features

This document outlines the implementation plan for adding 5 major features to the Budgeting App:

1. Custom Category Management
2. Transaction Editing
3. Date Range Filtering
4. Budget Period Management
5. Recurring Transactions

---

## Implementation Order & Dependencies

The features are ordered by dependency and complexity:

```
1. Custom Category Management (Foundation)
   ↓
2. Transaction Editing (Independent, Quick Win)
   ↓
3. Date Range Filtering (Enhances all views)
   ↓
4. Budget Period Management (Builds on filtering)
   ↓
5. Recurring Transactions (Most Complex)
```

---

## Feature 1: Custom Category Management

**Priority:** High (Foundation for other features)
**Estimated Time:** 6-8 hours
**Difficulty:** Medium

### Current State
- Categories are pre-seeded via `schema.sql`
- No way to add, edit, or delete categories
- Budget limits are fixed

### Goals
- Allow users to create custom categories
- Edit existing categories (name and budget limit)
- Delete categories (with safety checks)
- Prevent deleting categories with existing transactions

### Database Changes

**Option A: No schema changes needed** (categories table already has all required fields)

**Option B: Add soft delete support** (recommended)
```sql
ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

### Backend Implementation

**New API Endpoints:**

```javascript
// POST /api/categories - Create new category
// Request: { name: string, budget_limit: number }
// Response: { id, name, budget_limit, created_at }

// PUT /api/categories/:id - Update category
// Request: { name: string, budget_limit: number }
// Response: { id, name, budget_limit, updated_at }

// DELETE /api/categories/:id - Delete category
// Response: { success: boolean, message: string }
// Note: Prevent deletion if transactions exist
```

**Files to Modify:**
- `back_end/server.js` - Add new routes

**Validation Rules:**
- Category name must be unique (case-insensitive)
- Category name length: 1-50 characters
- Budget limit must be >= 0
- Cannot delete category with existing transactions (or offer cascade delete option)

### Frontend Implementation

**New Components:**

1. **CategoryManagement.jsx**
   - List all categories
   - Add new category form
   - Edit category inline or modal
   - Delete with confirmation dialog
   - Display transaction count per category

2. **CategoryForm.jsx** (Reusable)
   - Input for name
   - Input for budget limit (numeric)
   - Submit/Cancel buttons
   - Validation errors display

**Files to Modify:**
- `client/src/App.jsx` - Add route/tab for category management
- `client/src/components/Transactions.jsx` - Ensure category dropdown updates

**UI/UX Considerations:**
- Add "Manage Categories" button/tab to main navigation
- Show warning icon for categories over budget
- Disable delete for categories with transactions (show explanation)
- Success/error toast notifications

### Testing Checklist
- [ ] Create category with valid data
- [ ] Create category with duplicate name (should fail)
- [ ] Edit category name and budget limit
- [ ] Delete empty category
- [ ] Attempt to delete category with transactions (should prevent)
- [ ] Category dropdown updates in real-time

---

## Feature 2: Transaction Editing

**Priority:** High (Basic missing functionality)
**Estimated Time:** 4-5 hours
**Difficulty:** Easy-Medium

### Current State
- Can only add or delete transactions
- No way to correct mistakes without deleting

### Goals
- Edit all transaction fields (description, amount, category, type, date)
- Preserve transaction history/timestamps
- Inline editing or modal-based

### Database Changes

**Add updated_at column:**
```sql
ALTER TABLE transactions ADD COLUMN updated_at DATETIME;
```

### Backend Implementation

**New API Endpoint:**

```javascript
// PUT /api/transactions/:id - Update transaction
// Request: { description?, amount?, category_id?, transaction_type?, date? }
// Response: Updated transaction object

// Alternatively: PATCH for partial updates
```

**Files to Modify:**
- `back_end/server.js` - Add PUT/PATCH route

**Validation:**
- Same rules as POST /api/transactions
- Verify transaction exists before updating
- Validate category_id exists in categories table

### Frontend Implementation

**Components to Create/Modify:**

1. **EditTransactionModal.jsx** or inline edit in Transactions.jsx
   - Pre-populate form with existing values
   - Same validation as add transaction
   - Update button instead of Create

2. **Transactions.jsx**
   - Add edit icon/button to each transaction row
   - Open edit modal on click
   - Refresh list after successful edit

**Files to Modify:**
- `client/src/components/Transactions.jsx`

**UI/UX:**
- Edit icon next to delete icon
- Modal with pre-filled form
- Loading state during update
- Success notification
- Optimistic UI update (update list before API response)

### Testing Checklist
- [ ] Edit transaction description
- [ ] Edit transaction amount
- [ ] Change transaction category
- [ ] Change transaction type (income ↔ expense)
- [ ] Edit transaction date
- [ ] Cancel edit (no changes saved)
- [ ] Edit with invalid data (validation works)

---

## Feature 3: Date Range Filtering

**Priority:** High (Essential for budgeting)
**Estimated Time:** 6-8 hours
**Difficulty:** Medium

### Current State
- All transactions displayed regardless of date
- Charts show all-time data or hardcoded last 12 months
- No way to analyze specific periods

### Goals
- Filter transactions by date range
- Quick presets (This Week, This Month, Last Month, etc.)
- Custom date picker for specific ranges
- Apply filters to all views (transactions, charts, budget summary)
- Persist filter selection in session/local storage

### Database Changes
**No schema changes needed** - filtering done via SQL WHERE clauses

### Backend Implementation

**Modify Existing Endpoints to Accept Date Parameters:**

```javascript
// Add optional query parameters to existing endpoints:
// ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

// Endpoints to modify:
// GET /api/transactions?start_date=...&end_date=...
// GET /api/budget-summary?start_date=...&end_date=...
// GET /api/charts/expense-breakdown?start_date=...&end_date=...
// GET /api/charts/monthly-trend?start_date=...&end_date=...
// GET /api/charts/income-expense?start_date=...&end_date=...
```

**Files to Modify:**
- `back_end/server.js` - Update all query endpoints

**SQL Example:**
```sql
SELECT * FROM transactions
WHERE date >= ? AND date <= ?
ORDER BY date DESC
```

### Frontend Implementation

**New Components:**

1. **DateRangeFilter.jsx**
   - Preset buttons (Today, This Week, This Month, Last Month, This Year, All Time)
   - Custom date range picker (start + end date)
   - Apply/Clear buttons
   - Display active filter

2. **DatePicker.jsx** (use existing library or build with input type="date")

**State Management:**
- Create global filter context or use App-level state
- Store: { startDate, endDate, presetName }
- All components read from this state

**Files to Modify:**
- `client/src/App.jsx` - Add filter state context
- `client/src/components/Dashboard.jsx` - Apply filters to API calls
- `client/src/components/Transactions.jsx` - Filter transactions
- `client/src/components/Charts.jsx` - Filter chart data
- `client/src/components/BudgetOverview.jsx` - Filter budget summary

**Filter Presets Logic:**

```javascript
const presets = {
  today: { start: startOfDay(new Date()), end: endOfDay(new Date()) },
  thisWeek: { start: startOfWeek(new Date()), end: endOfWeek(new Date()) },
  thisMonth: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  lastMonth: { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
  thisYear: { start: startOfYear(new Date()), end: endOfYear(new Date()) },
  allTime: { start: null, end: null }
};
```

**Consider using:** `date-fns` library for date manipulation (already lightweight)

### Storage
- Save filter preference to localStorage
- Restore on page load
- Default to "This Month"

### Testing Checklist
- [ ] Select "This Month" preset - shows only current month transactions
- [ ] Select "Last Month" preset - shows previous month
- [ ] Select custom date range - shows transactions in range
- [ ] Clear filter - shows all transactions
- [ ] Filter persists on page refresh
- [ ] Charts update based on filter
- [ ] Budget summary updates based on filter
- [ ] Filter with no results shows empty state

---

## Feature 4: Budget Period Management

**Priority:** Medium-High (Builds on date filtering)
**Estimated Time:** 8-10 hours
**Difficulty:** Medium-High

### Current State
- Budget limits are static (all-time)
- No concept of monthly/weekly budget resets
- Budget summary shows all-time spending vs limits

### Goals
- Define budget periods (weekly, monthly, yearly)
- Each period has its own budget limits per category
- View historical periods
- Compare periods side-by-side
- Budget limits reset each period

### Database Changes

**New Table: budget_periods**
```sql
CREATE TABLE budget_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type TEXT NOT NULL, -- 'weekly', 'monthly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_periods_dates ON budget_periods(start_date, end_date);
```

**New Table: period_category_budgets**
```sql
CREATE TABLE period_category_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    budget_limit REAL DEFAULT 0,
    FOREIGN KEY (period_id) REFERENCES budget_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(period_id, category_id)
);
```

**Migration Strategy:**
- Keep existing `categories.budget_limit` as default/template
- Create initial period from earliest transaction date to now
- Copy budget_limit values to period_category_budgets

### Backend Implementation

**New API Endpoints:**

```javascript
// GET /api/periods - List all periods
// GET /api/periods/current - Get current active period
// GET /api/periods/:id - Get specific period details
// POST /api/periods - Create new period
// PUT /api/periods/:id - Update period
// DELETE /api/periods/:id - Delete period

// GET /api/periods/:id/budgets - Get category budgets for period
// PUT /api/periods/:id/budgets - Update category budgets for period

// GET /api/budget-summary?period_id=X - Budget summary for specific period
```

**Files to Modify:**
- `back_end/server.js` - Add period management routes
- `back_end/db.js` - Add migration script

**Business Logic:**
- Auto-create new period when current period ends (cron job or on-demand)
- Detect current period based on today's date
- Copy budget limits from previous period when creating new period
- Prevent overlapping periods

### Frontend Implementation

**New Components:**

1. **PeriodSelector.jsx**
   - Dropdown to select period (Current, Previous, or specific period)
   - Navigation: Previous/Next period buttons
   - Display: "January 2025" or "Week 43, 2025"

2. **PeriodManagement.jsx**
   - List all periods
   - Create new period form
   - Edit period budgets
   - Set period type (weekly/monthly/yearly)

3. **PeriodComparison.jsx** (Optional - future enhancement)
   - Side-by-side comparison of multiple periods

**Files to Modify:**
- `client/src/App.jsx` - Add period context
- `client/src/components/BudgetOverview.jsx` - Show period-specific budgets
- `client/src/components/Dashboard.jsx` - Display current period
- All chart components - Filter by period

**State Management:**
- Global period context
- Current selected period ID
- Period metadata (dates, type)

### Automatic Period Creation

**Option 1: Backend Cron Job**
```javascript
// Use node-cron to check daily if new period needed
import cron from 'node-cron';

cron.schedule('0 0 * * *', () => {
  // Check if current period has ended
  // Create new period if needed
});
```

**Option 2: On-Demand Creation**
- Check on app load if current period exists
- Prompt user to create new period if needed
- Auto-create with default values

### Testing Checklist
- [ ] Create monthly period
- [ ] Create weekly period
- [ ] View budget summary for specific period
- [ ] Switch between periods
- [ ] Edit budget limits for specific period
- [ ] Verify transactions associate with correct period
- [ ] Auto-create new period when current ends
- [ ] Cannot create overlapping periods

---

## Feature 5: Recurring Transactions

**Priority:** Medium (Complex, high value)
**Estimated Time:** 10-12 hours
**Difficulty:** High

### Current State
- All transactions must be manually entered
- No automation for predictable expenses/income

### Goals
- Define recurring transaction templates
- Set frequency (daily, weekly, bi-weekly, monthly, yearly)
- Set start and optional end dates
- Auto-create transactions based on schedule
- Edit/delete templates
- View upcoming recurring transactions

### Database Changes

**New Table: recurring_transactions**
```sql
CREATE TABLE recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    transaction_type TEXT NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for no end date
    next_occurrence DATE NOT NULL, -- Next date to create transaction
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_recurring_next_occurrence ON recurring_transactions(next_occurrence, is_active);
```

**New Column: transactions table**
```sql
ALTER TABLE transactions ADD COLUMN recurring_transaction_id INTEGER;
ALTER TABLE transactions ADD COLUMN is_recurring INTEGER DEFAULT 0;
```

### Backend Implementation

**New API Endpoints:**

```javascript
// GET /api/recurring - List all recurring transactions
// GET /api/recurring/:id - Get specific recurring transaction
// POST /api/recurring - Create new recurring transaction
// PUT /api/recurring/:id - Update recurring transaction
// DELETE /api/recurring/:id - Delete recurring transaction (with options)

// POST /api/recurring/:id/deactivate - Stop recurring without deleting
// GET /api/recurring/upcoming - Get next 30 days of scheduled transactions
```

**Scheduler Implementation:**

**Option 1: Node-cron (Recommended for single server)**
```javascript
import cron from 'node-cron';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  await processRecurringTransactions();
});

async function processRecurringTransactions() {
  // Get all active recurring transactions where next_occurrence <= today
  // Create actual transactions
  // Update next_occurrence based on frequency
}
```

**Option 2: On-Demand Processing**
```javascript
// Check and process on:
// - App startup
// - User login
// - Dashboard load
// - Manual "Process Recurring" button
```

**Frequency Calculation:**
```javascript
function calculateNextOccurrence(currentDate, frequency) {
  switch (frequency) {
    case 'daily': return addDays(currentDate, 1);
    case 'weekly': return addWeeks(currentDate, 1);
    case 'biweekly': return addWeeks(currentDate, 2);
    case 'monthly': return addMonths(currentDate, 1);
    case 'yearly': return addYears(currentDate, 1);
  }
}
```

**Files to Create:**
- `back_end/scheduler.js` - Recurring transaction processor

**Files to Modify:**
- `back_end/server.js` - Add recurring routes, initialize scheduler

### Frontend Implementation

**New Components:**

1. **RecurringTransactions.jsx**
   - List all recurring templates
   - Add new recurring transaction form
   - Edit existing recurring
   - Delete with options (keep/delete generated transactions)
   - Toggle active/inactive

2. **RecurringTransactionForm.jsx**
   - All transaction fields
   - Frequency selector (dropdown)
   - Start date picker
   - End date picker (optional)
   - Preview: "Next 3 occurrences: ..."

3. **UpcomingRecurring.jsx** (Dashboard widget)
   - Show next 5 upcoming scheduled transactions
   - "Process Now" button (manual trigger)

**Files to Modify:**
- `client/src/App.jsx` - Add recurring transactions tab/route
- `client/src/components/Dashboard.jsx` - Show upcoming recurring
- `client/src/components/Transactions.jsx` - Mark recurring transactions with icon

**UI Enhancements:**
- Badge/icon on transactions created from recurring templates
- Different color for recurring vs manual transactions
- "View template" link on recurring transactions

### Edge Cases to Handle

1. **End Date Reached**
   - Auto-deactivate recurring transaction
   - Notify user

2. **Category Deleted**
   - Deactivate or prompt user to reassign

3. **Date Calculation Issues**
   - Monthly: What if start date is Jan 31? (Handle Feb 28/29)
   - Solution: Use "same day next month" or "last day of month"

4. **Missed Occurrences**
   - If app not running for days, backfill or skip?
   - Option 1: Create all missed (backfill)
   - Option 2: Skip to next future date

5. **Duplicate Prevention**
   - Track last processed date
   - Check if transaction already exists for date

### Testing Checklist
- [ ] Create daily recurring transaction
- [ ] Create weekly recurring transaction
- [ ] Create monthly recurring transaction
- [ ] Create recurring with end date
- [ ] Edit recurring template
- [ ] Delete recurring (keep generated transactions)
- [ ] Delete recurring (delete all generated transactions)
- [ ] Deactivate recurring
- [ ] Verify transactions auto-created on schedule
- [ ] Handle end date reached
- [ ] Handle deleted category
- [ ] Preview upcoming occurrences

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Day 1-2: Custom Category Management
- Day 3: Transaction Editing
- Day 4-5: Date Range Filtering

**Deliverable:** Users can manage categories, edit transactions, and filter by date

### Phase 2: Advanced Features (Week 2)
- Day 1-3: Budget Period Management
- Day 4-5: Recurring Transactions (setup + basic functionality)

**Deliverable:** Period-based budgeting and recurring transactions

### Phase 3: Polish & Testing (Week 3)
- Day 1-2: Recurring transaction scheduler refinement
- Day 3-4: Integration testing, bug fixes
- Day 5: Documentation updates, deployment

---

## Technical Dependencies

### New NPM Packages to Consider

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",           // Date manipulation
    "node-cron": "^3.0.3"            // Recurring transaction scheduler
  }
}
```

### Optional Enhancements
- `react-datepicker` - Better date picker UI
- `recharts` - More advanced charts (alternative to Chart.js)
- `react-hot-toast` - Better notifications

---

## Database Migration Strategy

Create migration scripts:

```
back_end/migrations/
  ├── 001_add_category_soft_delete.sql
  ├── 002_add_transaction_updated_at.sql
  ├── 003_create_budget_periods.sql
  ├── 004_create_period_category_budgets.sql
  ├── 005_create_recurring_transactions.sql
  └── 006_add_recurring_id_to_transactions.sql
```

**Migration Runner:**
```javascript
// back_end/migrate.js
import fs from 'fs';
import db from './db.js';

async function runMigrations() {
  // Track migrations in database
  // Run pending migrations in order
  // Log results
}
```

---

## API Versioning Consideration

If breaking changes needed:
- Add `/api/v2/` prefix for new endpoints
- Keep `/api/` (v1) for backward compatibility
- Deprecate v1 gradually

---

## Testing Strategy

### Unit Tests (Future)
- Test date calculation functions
- Test recurring transaction frequency logic
- Test budget period overlap detection

### Integration Tests
- Test full workflow: Create category → Add transaction → View in period
- Test recurring transaction generation

### Manual Testing
- Create test checklist for each feature (see individual feature sections)
- Test on different browsers
- Test with large datasets (performance)

---

## Documentation Updates Needed

1. **SETUP_INSTRUCTIONS.md**
   - Add new features to features list
   - Update database schema section
   - Add new API endpoints

2. **README.md**
   - Update feature list
   - Add screenshots (if desired)

3. **API_DOCUMENTATION.md** (New file)
   - Complete API reference for all endpoints
   - Request/response examples
   - Error codes

4. **USER_GUIDE.md** (New file - Optional)
   - How to use new features
   - Best practices
   - FAQ

---

## Rollback Plan

If issues arise during implementation:

1. **Use Git Branches**
   - Create feature branch for each feature
   - Don't merge to main until tested
   - Can easily revert if needed

2. **Database Backups**
   - Backup `budget.db` before migrations
   - Keep migration rollback scripts

3. **Feature Flags** (Optional)
   - Add config to enable/disable features
   - Can turn off problematic features without code changes

---

## Success Metrics

After implementation, the app should support:

✅ Full category lifecycle management
✅ Transaction editing capabilities
✅ Flexible date range analysis
✅ Monthly budget tracking with periods
✅ Automated recurring transaction creation

**User Experience Improvements:**
- 50% reduction in manual data entry (recurring transactions)
- Better financial insights (date filtering + periods)
- More personalized (custom categories)
- Fewer mistakes (transaction editing)

---

## Next Steps

1. Review this plan with stakeholders
2. Set up development environment
3. Create feature branches
4. Begin Phase 1 implementation
5. Regular testing and iteration

---

**Questions or clarifications needed before starting implementation?**
