/**
 * Transactions Component with shadcn/ui
 *
 * Manages all transaction-related functionality with modern UI
 */

import { useState } from 'react'
import { Download, Trash2, AlertCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

function Transactions({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction,
  onExportCSV,
  onClearDatabase
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    transaction_type: ''
  })
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await onAddTransaction(formData)
    if (success) {
      showNotification('success', 'Transaction added!')
      setFormData({ description: '', amount: '', category_id: '', transaction_type: '' })
    } else {
      showNotification('error', 'Failed to add transaction')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      const success = await onDeleteTransaction(id)
      showNotification(success ? 'success' : 'error', success ? 'Deleted!' : 'Failed to delete')
    }
  }

  const handleClearDatabase = async () => {
    const success = await onClearDatabase()
    showNotification(success ? 'success' : 'error', success ? 'All cleared!' : 'Failed to clear')
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white animate-in slide-in-from-right`}>
          {notification.message}
        </div>
      )}

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Transaction
          </CardTitle>
          <CardDescription>Record a new income or expense</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <Select
              required
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
            >
              <option value="">Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <Button type="submit" className="w-full">Add</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>{transactions.length} total transactions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearDatabase}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions yet. Add one above!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.description}</p>
                      <Badge variant={t.transaction_type === 'income' ? 'default' : 'secondary'}>
                        {t.transaction_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.category_name || 'Uncategorized'} • {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-semibold ${
                      t.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {t.transaction_type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(t.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default Transactions
