/**
 * Main App Component
 *
 * This is the root component of the budgeting application.
 * It manages the overall application state and routing between different tabs/views.
 * Handles data fetching and communication with the backend API.
 */

import { useState, useEffect } from 'react'
import { LayoutDashboard, Receipt, PieChart, BarChart3, FolderOpen, CalendarRange } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import BudgetOverview from './components/BudgetOverview'
import Charts from './components/Charts'
import CategoryManagement from './components/CategoryManagement'
import PeriodManagement from './components/PeriodManagement'
import { Button } from '@/components/ui/button'

function App() {
  // State management for active tab and data
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgetSummary, setBudgetSummary] = useState([])
  const [dateFilter, setDateFilter] = useState({ start: null, end: null, preset: 'thisMonth' })
  const [currentPeriod, setCurrentPeriod] = useState(null)

  /**
   * Fetch initial data when component mounts
   */
  useEffect(() => {
    fetchCategories()
  }, [])

  /**
   * Refetch transactions and budget summary when date filter or period changes
   */
  useEffect(() => {
    fetchTransactions()
    fetchBudgetSummary()
  }, [dateFilter, currentPeriod])

  /**
   * Fetches all transactions from the API
   * Applies date filter if set
   */
  const fetchTransactions = async () => {
    try {
      let url = '/api/transactions'
      const params = new URLSearchParams()

      if (dateFilter.start) {
        params.append('start_date', dateFilter.start)
      }
      if (dateFilter.end) {
        params.append('end_date', dateFilter.end)
      }

      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  /**
   * Fetches all categories from the API
   */
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  /**
   * Fetches budget summary data from the API
   * Applies date filter and period if set
   */
  const fetchBudgetSummary = async () => {
    try {
      let url = '/api/budget-summary'
      const params = new URLSearchParams()

      // Add period_id if period is selected
      if (currentPeriod) {
        params.append('period_id', currentPeriod.id)
      }

      if (dateFilter.start) {
        params.append('start_date', dateFilter.start)
      }
      if (dateFilter.end) {
        params.append('end_date', dateFilter.end)
      }

      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url)
      const data = await response.json()
      setBudgetSummary(data)
    } catch (error) {
      console.error('Error fetching budget summary:', error)
    }
  }

  /**
   * Adds a new transaction
   * @param {Object} transactionData - The transaction data to add
   * @returns {boolean} - True if successful, false otherwise
   */
  const addTransaction = async (transactionData) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (response.ok) {
        // Refresh data after successful addition
        await fetchTransactions()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error adding transaction:', error)
      return false
    }
  }

  /**
   * Updates an existing transaction
   * @param {number} id - The ID of the transaction to update
   * @param {Object} transactionData - The updated transaction data
   * @returns {boolean} - True if successful, false otherwise
   */
  const updateTransaction = async (id, transactionData) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (response.ok) {
        // Refresh data after successful update
        await fetchTransactions()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating transaction:', error)
      return false
    }
  }

  /**
   * Deletes a transaction by ID
   * @param {number} id - The ID of the transaction to delete
   * @returns {boolean} - True if successful, false otherwise
   */
  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh data after successful deletion
        await fetchTransactions()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting transaction:', error)
      return false
    }
  }

  /**
   * Clears all transactions from the database
   * Shows a confirmation dialog before proceeding
   * @returns {boolean} - True if successful, false otherwise
   */
  const clearDatabase = async () => {
    if (!window.confirm('Are you sure you want to delete ALL transactions? This cannot be undone!')) {
      return false
    }

    try {
      const response = await fetch('/api/clear-database', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh data after clearing
        await fetchTransactions()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error clearing database:', error)
      return false
    }
  }

  /**
   * Triggers CSV export by navigating to the export endpoint
   */
  const exportToCSV = () => {
    window.location.href = '/api/export/csv'
  }

  /**
   * Handles date filter changes
   * @param {string} startDate - The start date (YYYY-MM-DD) or null
   * @param {string} endDate - The end date (YYYY-MM-DD) or null
   * @param {string} presetName - The name of the preset filter applied
   */
  const handleDateFilterChange = (startDate, endDate, presetName) => {
    setDateFilter({
      start: startDate,
      end: endDate,
      preset: presetName
    })
  }

  /**
   * Handles period selection changes
   * @param {Object} period - The selected period object
   */
  const handlePeriodChange = (period) => {
    setCurrentPeriod(period)
    // Optionally update date filter to match period dates
    if (period) {
      setDateFilter({
        start: period.start_date,
        end: period.end_date,
        preset: 'custom'
      })
    }
  }

  /**
   * Adds a new category
   * @param {Object} categoryData - The category data to add
   * @returns {boolean} - True if successful, false otherwise
   */
  const addCategory = async (categoryData) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        // Refresh categories after successful addition
        await fetchCategories()
        return true
      }
      return false
    } catch (error) {
      console.error('Error adding category:', error)
      return false
    }
  }

  /**
   * Updates an existing category
   * @param {number} id - The ID of the category to update
   * @param {Object} categoryData - The updated category data
   * @returns {boolean} - True if successful, false otherwise
   */
  const updateCategory = async (id, categoryData) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        // Refresh categories and budget summary after successful update
        await fetchCategories()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating category:', error)
      return false
    }
  }

  /**
   * Deletes a category by ID
   * @param {number} id - The ID of the category to delete
   * @returns {boolean} - True if successful, false otherwise
   */
  const deleteCategory = async (id) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh categories and budget summary after successful deletion
        await fetchCategories()
        await fetchBudgetSummary()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting category:', error)
      return false
    }
  }

  /**
   * Renders the appropriate component based on the active tab
   * @returns {JSX.Element} - The component for the active tab
   */
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={transactions}
            onDateFilterChange={handleDateFilterChange}
          />
        )
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            categories={categories}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onExportCSV={exportToCSV}
            onClearDatabase={clearDatabase}
          />
        )
      case 'categories':
        return (
          <CategoryManagement
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        )
      case 'budget':
        return (
          <BudgetOverview
            budgetSummary={budgetSummary}
            currentPeriod={currentPeriod}
            onPeriodChange={handlePeriodChange}
          />
        )
      case 'charts':
        return (
          <Charts
            dateFilter={dateFilter}
          />
        )
      case 'periods':
        return (
          <PeriodManagement
            onPeriodCreated={handlePeriodChange}
          />
        )
      default:
        return (
          <Dashboard
            transactions={transactions}
            onDateFilterChange={handleDateFilterChange}
          />
        )
    }
  }

  // Navigation tabs configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'periods', label: 'Periods', icon: CalendarRange },
    { id: 'charts', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Modern Header with Gradient */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              My Budgeting App
            </h1>

            {/* Modern Tab Navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="animate-in fade-in duration-500">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  )
}

export default App
