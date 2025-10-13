/**
 * Main App Component
 *
 * This is the root component of the budgeting application.
 * It manages the overall application state and routing between different tabs/views.
 * Handles data fetching and communication with the backend API.
 */

import { useState, useEffect } from 'react'
import { LayoutDashboard, Receipt, PieChart, BarChart3 } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import BudgetOverview from './components/BudgetOverview'
import Charts from './components/Charts'
import { Button } from '@/components/ui/button'

function App() {
  // State management for active tab and data
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgetSummary, setBudgetSummary] = useState([])

  /**
   * Fetch initial data when component mounts
   */
  useEffect(() => {
    fetchTransactions()
    fetchCategories()
    fetchBudgetSummary()
  }, [])

  /**
   * Fetches all transactions from the API
   */
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
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
   */
  const fetchBudgetSummary = async () => {
    try {
      const response = await fetch('/api/budget-summary')
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
   * Renders the appropriate component based on the active tab
   * @returns {JSX.Element} - The component for the active tab
   */
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} />
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            categories={categories}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onExportCSV={exportToCSV}
            onClearDatabase={clearDatabase}
          />
        )
      case 'budget':
        return <BudgetOverview budgetSummary={budgetSummary} />
      case 'charts':
        return <Charts />
      default:
        return <Dashboard transactions={transactions} />
    }
  }

  // Navigation tabs configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budget', label: 'Budget', icon: PieChart },
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
