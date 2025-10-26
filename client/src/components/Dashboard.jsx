/**
 * Dashboard Component
 *
 * Displays a summary of the user's financial status including:
 * - Total income
 * - Total expenses
 * - Net balance
 * - Recent transactions (last 5)
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DateRangeFilter from './DateRangeFilter'

function Dashboard({ transactions, onDateFilterChange }) {
  /**
   * Calculate financial summary from transactions
   * Memoized to avoid recalculation on every render
   */
  const summary = useMemo(() => {
    // Calculate total income
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    // Calculate total expenses
    const expenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    return {
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      balance: (income - expenses).toFixed(2)
    }
  }, [transactions])

  // Get the 5 most recent transactions
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Date Range Filter */}
      <DateRangeFilter onFilterChange={onDateFilterChange} />

      {/* Summary Cards Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Income Card */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${summary.income}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">${summary.expenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time spending
            </p>
          </CardContent>
        </Card>

        {/* Net Balance Card */}
        <Card className={`border-${parseFloat(summary.balance) >= 0 ? 'blue' : 'orange'}-200 bg-gradient-to-br from-${parseFloat(summary.balance) >= 0 ? 'blue' : 'orange'}-50 to-white`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className={`h-4 w-4 text-${parseFloat(summary.balance) >= 0 ? 'blue' : 'orange'}-600`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-${parseFloat(summary.balance) >= 0 ? 'blue' : 'orange'}-700`}>
              ${summary.balance}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {parseFloat(summary.balance) >= 0 ? 'Positive balance' : 'Negative balance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest 5 financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            // Show message when no transactions exist
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No transactions yet. Add your first transaction to get started!
              </p>
            </div>
          ) : (
            // Display recent transactions
            <div className="space-y-4">
              {recentTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Transaction Type Icon */}
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>

                    {/* Transaction Info */}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category_name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Amount */}
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.transaction_type === 'income'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}$
                      {parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
